import { PrismaClient } from "@prisma/client";
import { auditContextStorage, transactionContextStorage } from "../utils/context";
import { eventBus } from "../events/event-bus";
import logger from "../utils/logger";

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

const extendedPrisma = basePrisma.$extends({
  query: {
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
            setImmediate(async () => {
              try {
                await logWriter();
              } catch (e) {}
            });
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
            setImmediate(async () => {
              try {
                await logWriter();
              } catch (e) {}
            });
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
            setImmediate(async () => {
              try {
                await logWriter();
              } catch (e) {}
            });
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
          try {
            await logFn();
          } catch (e) {
            logger.error(`[Transaction] Post-commit audit log write failed:`, e);
          }
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

export const prisma = extendedPrisma;
export default prisma;
