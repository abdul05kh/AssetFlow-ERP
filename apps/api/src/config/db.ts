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

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

const extendedPrisma = basePrisma.$extends({
  query: {
    $allOperations: async ({ model, operation, args, query }: { model?: string; operation: string; args: any; query: (args: any) => Promise<any> }) => {
      const startTime = Date.now();
      const result = await query(args);
      const duration = Date.now() - startTime;

      // Track query performance metrics
      dbMetrics.totalQueries++;
      dbMetrics.queryDurations.push(duration);
      dbMetrics.totalDurationMs += duration;

      const isWrite = ["create", "update", "delete", "upsert", "createMany", "updateMany", "deleteMany"].includes(operation);
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
    },

    $allModels: {
      async create({ model, operation, args, query }: { model: string; operation: string; args: any; query: (args: any) => Promise<any> }) {
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

      async update({ model, operation, args, query }: { model: string; operation: string; args: any; query: (args: any) => Promise<any> }) {
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

      async delete({ model, operation, args, query }: { model: string; operation: string; args: any; query: (args: any) => Promise<any> }) {
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
    const pendingAuditLogs: Array<() => Promise<void>> = [];
    const pendingEvents: Array<{ eventName: string; data: any }> = [];
    const startTime = Date.now();

    const callbackWrapper = async (tx: any) => {
      return transactionContextStorage.run(
        { inTransaction: true, txClient: tx, pendingAuditLogs, pendingEvents },
        () => arg1(tx)
      );
    };

    try {
      const result = await originalTransaction.call(this, callbackWrapper, arg2);

      // Flush events and audit logs asynchronously post-commit
      setImmediate(async () => {
        for (const ev of pendingEvents) {
          try {
            logger.debug(`[Transaction] Post-commit dispatching event: ${ev.eventName}`);
            eventBus.emit(ev.eventName, ev.data);
          } catch (e) {
            logger.error(`[Transaction] Event handler failed for ${ev.eventName}:`, e);
          }
        }

        for (const logFn of pendingAuditLogs) {
          jobQueue.push(logFn);
        }
      });

      return result;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const context = auditContextStorage.getStore();
      
      logger.error(`[Transaction] Interactive transaction failed / timed out after ${duration}ms.`, {
        correlationId: context?.correlationId || "N/A",
        errorMessage: err.message,
        errorCode: err.code,
        durationMs: duration,
        userId: context?.userId || null,
      });
      throw err;
    }
  }

  return originalTransaction.call(this, arg1, arg2);
};

export type TransactionClient = Parameters<Parameters<typeof extendedPrisma.$transaction>[0]>[0];
export const prisma = extendedPrisma;
export default prisma;
