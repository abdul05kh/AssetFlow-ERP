import eventBus from "../../../events/event-bus";
import { prisma } from "../../../config/db";
import logger from "../../../utils/logger";

export const registerMaintenanceEvents = () => {
  eventBus.subscribe("MaintenanceCreated", async (data: {
    requestId: string;
    assetId: string;
    assetTag: string;
    requestedById: string;
    priority: string;
  }) => {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.requestedById,
          action: "MAINT_REQUEST",
          targetType: "Asset",
          targetId: data.assetId,
          currentState: "PENDING",
          remarks: `Maintenance ticket raised for asset ${data.assetTag} with priority ${data.priority}. Ticket ID: ${data.requestId}`,
        },
      });
      logger.info(`[MaintenanceEvents] Activity log written for maintenance request: ${data.assetTag}`);
    } catch (err) {
      logger.error("[MaintenanceEvents] Failed to write maintenance request log", err);
    }
  });

  eventBus.subscribe("MaintenanceResolved", async (data: {
    requestId: string;
    assetId: string;
    assetTag: string;
    technicianId: string;
    cost: number;
  }) => {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.technicianId,
          action: "MAINT_RESOLVE",
          targetType: "Asset",
          targetId: data.assetId,
          currentState: "UNDER_MAINTENANCE",
          remarks: `Maintenance ticket resolved for asset ${data.assetTag}. Repair cost recorded: $${data.cost}. Ticket ID: ${data.requestId}`,
        },
      });
      logger.info(`[MaintenanceEvents] Activity log written for maintenance resolution: ${data.assetTag}`);
    } catch (err) {
      logger.error("[MaintenanceEvents] Failed to write maintenance resolution log", err);
    }
  });
};
