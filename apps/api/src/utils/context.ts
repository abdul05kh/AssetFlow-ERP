import { AsyncLocalStorage } from "async_hooks";

export interface AuditLogContext {
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

export const auditContextStorage = new AsyncLocalStorage<AuditLogContext>();

export interface TransactionContext {
  inTransaction: boolean;
  txClient: any;
  pendingAuditLogs: Array<() => Promise<void>>;
  pendingEvents: Array<{ eventName: string; data: any }>;
  isRecursive?: boolean;
  queryCount?: number;
  queryDurationSumMs?: number;
  lockWaitMs?: number;
  id?: string;
}

export const transactionContextStorage = new AsyncLocalStorage<TransactionContext>();

export default auditContextStorage;
