import { PrismaClient } from "@prisma/client";
import { auditContextStorage, transactionContextStorage } from "../utils/context";
import { eventBus } from "../events/event-bus";
import logger from "../utils/logger";
import { jobQueue } from "../utils/job-queue";

export interface DbPerformanceMetrics {
  totalQueries: number;
  totalReads: number;
  totalWrites: number;
  totalDurationMs: number;
  slowestQueries: Array<{ model: string; operation: string; durationMs: number; queryArgs: string }>;
  queryDurations: number[];
}

export const dbMetrics: DbPerformanceMetrics = {
  totalQueries: 0,
  totalReads: 0,
  totalWrites: 0,
  totalDurationMs: 0,
  slowestQueries: [],
  queryDurations: [],
};

class Mutex {
  private queue: Array<() => void> = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise<() => void>((resolve) => {
      const release = () => {
        if (this.queue.length > 0) {
          const next = this.queue.shift();
          next?.();
        } else {
          this.locked = false;
        }
      };

      if (this.locked) {
        this.queue.push(() => resolve(release));
      } else {
        this.locked = true;
        resolve(release);
      }
    });
  }
}

const sqliteTransactionMutex = new Mutex();
const isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:") || process.env.DATABASE_URL.includes(".db");

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

const extendedPrisma = basePrisma.$extends({
  query: {
    $allOperations: async ({ model, operation, args, query }) => {
      const txContext = transactionContextStorage.getStore();
      logger.info(`[Telemetry] Intercepted query: ${model || "Raw"}.${operation} | In transaction: ${!!txContext?.inTransaction}`);
      if (txContext && txContext.inTransaction) {
        txContext.queryCount = (txContext.queryCount || 0) + 1;
      }

      const isWrite = ["create", "update", "delete", "upsert", "createMany", "updateMany", "deleteMany", "executeRaw", "queryRaw"].includes(operation);
      const shouldLock = isSqlite && isWrite && !(txContext && txContext.inTransaction);

      const release = shouldLock ? await sqliteTransactionMutex.acquire() : null;
      try {
        const startTime = Date.now();
        const result = await query(args);
        const duration = Date.now() - startTime;

        if (txContext && txContext.inTransaction) {
          txContext.queryDurationSumMs = (txContext.queryDurationSumMs || 0) + duration;
        }

        // Track query performance metrics
        dbMetrics.totalQueries++;
        dbMetrics.queryDurations.push(duration);
        dbMetrics.totalDurationMs += duration;

        if (isWrite) {
          dbMetrics.totalWrites++;
        } else {
          dbMetrics.totalReads++;
        }

        // Track slowest queries (keep top 10)
        dbMetrics.slowestQueries.push({
          model: model || "Raw",
          operation,
          durationMs: duration,
          queryArgs: JSON.stringify(args),
        });
        dbMetrics.slowestQueries.sort((a, b) => b.durationMs - a.durationMs);
        if (dbMetrics.slowestQueries.length > 10) {
          dbMetrics.slowestQueries.pop();
        }

        return result;
      } finally {
        if (release) release();
      }
    },

    $allModels: {
      async create({ model, operation, args, query }) {
        const result = await query(args);

        if (model !== "AuditLog") {
          const context = auditContextStorage.getStore();
          const txContext = transactionContextStorage.getStore();

          const logWriter = async () => {
            await basePrisma.auditLog.create({
              data: {
                userId: context?.userId || null,
                action: "CREATE",
                tableName: model,
                recordId: (result as any)?.id || "N/A",
                changedValues: JSON.stringify({ old: null, new: result }),
                ipAddress: context?.ipAddress || null,
                userAgent: context?.userAgent || null,
                correlationId: context?.correlationId || null,
              },
            });
          };

          if (txContext && txContext.inTransaction) {
            txContext.pendingAuditLogs.push(logWriter);
          } else {
            jobQueue.push(logWriter);
          }
        }
        return result;
      },

      async update({ model, operation, args, query }) {
        const txContext = transactionContextStorage.getStore();
        let oldState: any = null;

        if (model !== "AuditLog" && args?.where) {
          // If inside active transaction and not recursive, query oldState on txClient (avoids separate read locks)
          if (txContext && txContext.txClient && !txContext.isRecursive) {
            try {
              oldState = await transactionContextStorage.run(
                { ...txContext, isRecursive: true },
                () => (txContext.txClient as any)[model].findUnique({ where: args.where })
              );
            } catch (e) {}
          } else {
            try {
              oldState = await (basePrisma as any)[model].findUnique({
                where: args.where,
              });
            } catch (e) {}
          }
        }

        const result = await query(args);

        if (model !== "AuditLog") {
          const context = auditContextStorage.getStore();

          const logWriter = async () => {
            await basePrisma.auditLog.create({
              data: {
                userId: context?.userId || null,
                action: "UPDATE",
                tableName: model,
                recordId: (result as any)?.id || "N/A",
                changedValues: JSON.stringify({ old: oldState, new: result }),
                ipAddress: context?.ipAddress || null,
                userAgent: context?.userAgent || null,
                correlationId: context?.correlationId || null,
              },
            });
          };

          if (txContext && txContext.inTransaction) {
            txContext.pendingAuditLogs.push(logWriter);
          } else {
            jobQueue.push(logWriter);
          }
        }
        return result;
      },

      async delete({ model, operation, args, query }) {
        const txContext = transactionContextStorage.getStore();
        let oldState: any = null;

        if (model !== "AuditLog" && args?.where) {
          if (txContext && txContext.txClient && !txContext.isRecursive) {
            try {
              oldState = await transactionContextStorage.run(
                { ...txContext, isRecursive: true },
                () => (txContext.txClient as any)[model].findUnique({ where: args.where })
              );
            } catch (e) {}
          } else {
            try {
              oldState = await (basePrisma as any)[model].findUnique({
                where: args.where,
              });
            } catch (e) {}
          }
        }

        const result = await query(args);

        if (model !== "AuditLog") {
          const context = auditContextStorage.getStore();

          const logWriter = async () => {
            await basePrisma.auditLog.create({
              data: {
                userId: context?.userId || null,
                action: "DELETE",
                tableName: model,
                recordId: (result as any)?.id || "N/A",
                changedValues: JSON.stringify({ old: oldState, new: null }),
                ipAddress: context?.ipAddress || null,
                userAgent: context?.userAgent || null,
                correlationId: context?.correlationId || null,
              },
            });
          };

          if (txContext && txContext.inTransaction) {
            txContext.pendingAuditLogs.push(logWriter);
          } else {
            jobQueue.push(logWriter);
          }
        }
        return result;
      },
    },
  },
});

// Monkey-patch $transaction at runtime to avoid breaking compile-time type signatures and overloads
const originalTransaction = (extendedPrisma as any).$transaction;
(extendedPrisma as any).$transaction = async function (arg1: any, arg2: any) {
  if (typeof arg1 === "function") {
    const requestTime = Date.now();
    const release = isSqlite ? await sqliteTransactionMutex.acquire() : null;
    const mutexWaitMs = Date.now() - requestTime;

    const pendingAuditLogs: Array<() => Promise<void>> = [];
    const pendingEvents: Array<{ eventName: string; data: any }> = [];
    const startTime = Date.now();
    const txId = Math.random().toString(36).substring(2, 9);
    let lockWaitMs = 0;
    const txMetrics = { queryCount: 0, queryDurationSumMs: 0 };

    const callbackWrapper = async (tx: any) => {
      lockWaitMs = Date.now() - startTime;
      return transactionContextStorage.run(
        { inTransaction: true, txClient: tx, pendingAuditLogs, pendingEvents, queryCount: 0, queryDurationSumMs: 0, lockWaitMs, id: txId },
        async () => {
          const res = await arg1(tx);
          const store = transactionContextStorage.getStore();
          if (store) {
            txMetrics.queryCount = store.queryCount || 0;
            txMetrics.queryDurationSumMs = store.queryDurationSumMs || 0;
          }
          return res;
        }
      );
    };

    try {
      const result = await originalTransaction.call(this, callbackWrapper, arg2);
      const txDuration = Date.now() - startTime;

      logger.info(`[Telemetry] [SUCCESS] Transaction [${txId}] committed. Total duration: ${txDuration}ms | Mutex wait: ${mutexWaitMs}ms | Lock wait: ${lockWaitMs}ms | Execution time: ${txDuration - lockWaitMs}ms | Query count: ${txMetrics.queryCount} | Queries duration: ${txMetrics.queryDurationSumMs}ms`);

      // Flush events and audit logs asynchronously post-commit
      setImmediate(async () => {
        const flushStart = Date.now();
        let eventDuration = 0;
        let auditDuration = 0;

        for (const ev of pendingEvents) {
          const evStart = Date.now();
          try {
            logger.debug(`[Transaction] Post-commit dispatching event: ${ev.eventName}`);
            eventBus.emit(ev.eventName, ev.data);
          } catch (e) {
            logger.error(`[Transaction] Event handler failed for ${ev.eventName}:`, e);
          }
          eventDuration += (Date.now() - evStart);
        }

        const auditStart = Date.now();
        for (const logFn of pendingAuditLogs) {
          jobQueue.push(logFn);
        }
        auditDuration = Date.now() - auditStart;

        logger.info(`[Telemetry] [POST-COMMIT] Transaction [${txId}] post-commit flush. Event emit duration: ${eventDuration}ms | Audit log queue enqueue duration: ${auditDuration}ms | Total flush duration: ${Date.now() - flushStart}ms`);
      });

      return result;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const context = auditContextStorage.getStore();
      
      logger.error(`[Telemetry] [FAILURE] Transaction [${txId}] failed / timed out after ${duration}ms. Mutex wait: ${mutexWaitMs}ms | Lock wait: ${lockWaitMs}ms | Query count: ${txMetrics.queryCount} | Queries duration: ${txMetrics.queryDurationSumMs}ms | Error: ${err.message}`, {
        correlationId: context?.correlationId || "N/A",
        errorMessage: err.message,
        errorCode: err.code,
        durationMs: duration,
        userId: context?.userId || null,
      });
      throw err;
    } finally {
      if (release) release();
    }
  }

  return originalTransaction.call(this, arg1, arg2);
};

export type TransactionClient = Omit<typeof extendedPrisma, "$transaction" | "$extends" | "$disconnect" | "$connect" | "$on">;
export const prisma = extendedPrisma;
export default prisma;
