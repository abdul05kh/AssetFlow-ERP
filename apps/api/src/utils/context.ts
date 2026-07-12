import { AsyncLocalStorage } from "async_hooks";

export interface AuditLogContext {
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

export const auditContextStorage = new AsyncLocalStorage<AuditLogContext>();
export default auditContextStorage;
