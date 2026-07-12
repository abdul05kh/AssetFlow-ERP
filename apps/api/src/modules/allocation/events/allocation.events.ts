import eventBus from "../../../events/event-bus";
import { prisma } from "../../../config/db";
import logger from "../../../utils/logger";

export const registerAllocationEvents = () => {
  eventBus.subscribe("AssetAllocated", async (data: {
    allocationId: string;
    assetId: string;
    assetTag: string;
    employeeId?: string | null;
    departmentId?: string | null;
    employeeName?: string | null;
    departmentName?: string | null;
  }) => {
    try {
      const assigneeName = data.employeeName
        ? `Employee: ${data.employeeName}`
        : `Department: ${data.departmentName}`;

      await prisma.activityLog.create({
        data: {
          userId: data.employeeId || null,
          action: "ALLOCATE",
          targetType: "Asset",
          targetId: data.assetId,
          currentState: "ALLOCATED",
          remarks: `Asset ${data.assetTag} allocated to ${assigneeName}. Allocation ID: ${data.allocationId}`,
        },
      });
      logger.info(`[AllocationEvents] Activity log written for Asset allocation: ${data.assetTag}`);
    } catch (err) {
      logger.error("[AllocationEvents] Failed to write asset allocation log", err);
    }
  });
};
