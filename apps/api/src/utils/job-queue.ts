import logger from "./logger";

export interface QueueMetrics {
  queueLength: number;
  completedJobs: number;
  failedJobs: number;
  retries: number;
  droppedJobs: number;
  averageExecutionTimeMs: number;
  processingRatePerSecond: number;
}

export class BackgroundJobQueue {
  private queue: Array<{
    id: string;
    task: () => Promise<void>;
    attempts: number;
    queuedAt: number;
  }> = [];

  private processing = false;
  private shuttingDown = false;
  private activePromise: Promise<void> | null = null;

  // Configuration limits
  private maxQueueSize = 2000;
  private maxRetries = 3;
  private retryDelayMs = 200;

  // Running metrics
  private completedJobsCount = 0;
  private failedJobsCount = 0;
  private totalRetriesCount = 0;
  private droppedJobsCount = 0;
  private totalExecutionTimeMs = 0;
  private totalCompletedWithTime = 0;
  private queueStartedAt = Date.now();

  constructor(config?: { maxQueueSize?: number; maxRetries?: number; retryDelayMs?: number }) {
    if (config?.maxQueueSize !== undefined) this.maxQueueSize = config.maxQueueSize;
    if (config?.maxRetries !== undefined) this.maxRetries = config.maxRetries;
    if (config?.retryDelayMs !== undefined) this.retryDelayMs = config.retryDelayMs;
  }

  async push(task: () => Promise<void>): Promise<boolean> {
    if (this.shuttingDown) {
      logger.warn("[JobQueue] Queue is shutting down. Cannot accept new jobs.");
      this.droppedJobsCount++;
      return false;
    }

    if (this.queue.length >= this.maxQueueSize) {
      logger.error(`[JobQueue] Queue limit reached (${this.maxQueueSize}). Job dropped to prevent memory overflow.`);
      this.droppedJobsCount++;
      return false;
    }

    this.queue.push({
      id: Math.random().toString(36).substring(2, 9),
      task,
      attempts: 0,
      queuedAt: Date.now(),
    });

    this.triggerProcessor();
    return true;
  }

  private triggerProcessor() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    this.activePromise = (async () => {
      while (this.queue.length > 0 && !this.shuttingDown) {
        const job = this.queue[0]; // Peek front of queue
        let success = false;
        const jobStartTime = Date.now();

        while (job.attempts < this.maxRetries && !success && !this.shuttingDown) {
          job.attempts++;
          try {
            await job.task();
            success = true;
          } catch (err: any) {
            logger.warn(`[JobQueue] Job [${job.id}] failed (attempt ${job.attempts}/${this.maxRetries}). Error: ${err.message}`);
            if (job.attempts < this.maxRetries && !this.shuttingDown) {
              this.totalRetriesCount++;
              await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
            }
          }
        }

        if (success) {
          const duration = Date.now() - jobStartTime;
          this.totalExecutionTimeMs += duration;
          this.totalCompletedWithTime++;
          this.completedJobsCount++;
          this.queue.shift(); // Remove from queue
        } else {
          this.failedJobsCount++;
          this.queue.shift(); // Remove from queue
          logger.error(`[JobQueue] Job [${job.id}] failed permanently after ${this.maxRetries} attempts.`);
        }
      }
      this.processing = false;
      this.activePromise = null;
    })();
  }

  getMetrics(): QueueMetrics {
    const elapsedSeconds = (Date.now() - this.queueStartedAt) / 1000;
    const avgTime = this.totalCompletedWithTime > 0
      ? this.totalExecutionTimeMs / this.totalCompletedWithTime
      : 0;
    const rate = elapsedSeconds > 0
      ? this.completedJobsCount / elapsedSeconds
      : 0;

    return {
      queueLength: this.queue.length,
      completedJobs: this.completedJobsCount,
      failedJobs: this.failedJobsCount,
      retries: this.totalRetriesCount,
      droppedJobs: this.droppedJobsCount,
      averageExecutionTimeMs: parseFloat(avgTime.toFixed(2)),
      processingRatePerSecond: parseFloat(rate.toFixed(2)),
    };
  }

  async shutdown(timeoutMs = 5000): Promise<void> {
    logger.info("[JobQueue] Shutting down background job queue gracefully...");
    this.shuttingDown = true;

    if (!this.processing || !this.activePromise) {
      return;
    }

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        logger.warn("[JobQueue] Graceful shutdown timeout reached. Some jobs may remain unprocessed.");
        resolve();
      }, timeoutMs);
    });

    await Promise.race([this.activePromise, timeoutPromise]);
  }
}

// Export a singleton queue instance
export const jobQueue = new BackgroundJobQueue({
  maxQueueSize: 2000,
  maxRetries: 3,
  retryDelayMs: 200,
});
