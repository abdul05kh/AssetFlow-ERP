import { app } from "./app";
import { env } from "./config/env";
import logger from "./utils/logger";
import { prisma } from "./config/db";
import { jobQueue } from "./utils/job-queue";

const server = app.listen(env.PORT, () => {
  logger.info(`[API] Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

// Graceful shutdown — called when Playwright or the OS terminates the process.
// Ensures port 4000 and the SQLite file lock are released immediately.
const shutdown = async (signal: string) => {
  logger.info(`[API] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await jobQueue.shutdown(3000);
    await prisma.$disconnect().catch(() => {});
    logger.info("[API] Server closed. Exiting.");
    process.exit(0);
  });
  // Force-kill if graceful shutdown takes longer than 8s
  setTimeout(() => process.exit(1), 8000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

export { server, app };

