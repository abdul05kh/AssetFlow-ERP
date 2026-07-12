import eventBus from "../../../events/event-bus";
import { prisma } from "../../../config/db";
import logger from "../../../utils/logger";

export const registerAuditEvents = () => {
  eventBus.subscribe("AuditCompleted", async (data: {
    auditId: string;
    name: string;
    departmentId: string;
    departmentName: string;
    hasDiscrepancy: boolean;
    auditorId: string;
  }) => {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.auditorId,
          action: "AUDIT_CLOSE",
          targetType: "Department",
          targetId: data.departmentId,
          currentState: "CLOSED",
          remarks: `Audit cycle ${data.name} completed for department ${data.departmentName}. Has Discrepancies: ${data.hasDiscrepancy}. Audit ID: ${data.auditId}`,
        },
      });
      logger.info(`[AuditEvents] Activity log written for Audit cycle closure: ${data.name}`);
    } catch (err) {
      logger.error("[AuditEvents] Failed to write audit closure log", err);
    }
  });
};
