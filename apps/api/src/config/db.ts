import { PrismaClient } from "@prisma/client";
import { auditContextStorage } from "../utils/context";

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async create({ model, operation, args, query }) {
        const result = await query(args);

        if (model !== "AuditLog") {
          const context = auditContextStorage.getStore();
          // Defer audit log write to avoid SQLite transaction write-lock deadlocks
          setImmediate(async () => {
            try {
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
            } catch (e) {
              // Fail silently
            }
          });
        }
        return result;
      },
      async update({ model, operation, args, query }) {
        let oldState: any = null;
        if (model !== "AuditLog" && args?.where) {
          try {
            oldState = await (basePrisma as any)[model].findUnique({
              where: args.where,
            });
          } catch (e) {}
        }

        const result = await query(args);

        if (model !== "AuditLog") {
          const context = auditContextStorage.getStore();
          setImmediate(async () => {
            try {
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
            } catch (e) {}
          });
        }
        return result;
      },
      async delete({ model, operation, args, query }) {
        let oldState: any = null;
        if (model !== "AuditLog" && args?.where) {
          try {
            oldState = await (basePrisma as any)[model].findUnique({
              where: args.where,
            });
          } catch (e) {}
        }

        const result = await query(args);

        if (model !== "AuditLog") {
          const context = auditContextStorage.getStore();
          setImmediate(async () => {
            try {
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
            } catch (e) {}
          });
        }
        return result;
      },
    },
  },
});

export default prisma;
