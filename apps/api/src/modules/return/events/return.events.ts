import eventBus from "../../../events/event-bus";
import { prisma } from "../../../config/db";
import logger from "../../../utils/logger";

export const registerReturnEvents = () => {
  eventBus.subscribe("AssetReturned", async (data: {
    allocationId: string;
    assetId: string;
    assetTag: string;
    employeeId?: string | null;
    employeeName?: string | null;
    departmentName?: string | null;
    conditionOnReturn: string;
    inspectorId: string;
  }) => {
    try {
      const returnerName = data.employeeName
        ? `Employee: ${data.employeeName}`
        : `Department: ${data.departmentName}`;

      await prisma.activityLog.create({
        data: {
          userId: data.employeeId || null,
          action: "RETURN",
          targetType: "Asset",
          targetId: data.assetId,
          currentState: "AVAILABLE",
          remarks: `Asset ${data.assetTag} returned by ${returnerName} with condition ${data.conditionOnReturn}. Allocation ID: ${data.allocationId}. Inspector ID: ${data.inspectorId}`,
        },
      });
      logger.info(`[ReturnEvents] Activity log written for Asset return: ${data.assetTag}`);
    } catch (err) {
      logger.error("[ReturnEvents] Failed to write asset return log", err);
    }
  });
};
