import { returnRepository } from "../repository/return.repository";
import { ReturnAssetInput } from "../validator/return.validator";
import { NotFoundError } from "../../../utils/errors";
import { prisma } from "../../../config/db";
import eventBus from "../../../events/event-bus";
import logger from "../../../utils/logger";

export class ReturnService {
  async returnAsset(input: ReturnAssetInput, inspectorId: string) {
    // 1. Verify asset details
    const asset = await prisma.asset.findUnique({
      where: { id: input.assetId },
    });

    if (!asset) {
      throw new NotFoundError("Target asset does not exist");
    }

    // 2. Perform return inside transaction
    const allocation = await returnRepository.executeReturn(input);

    // 3. Publish domain event
    eventBus.publish("AssetReturned", {
      allocationId: allocation.id,
      assetId: allocation.assetId,
      assetTag: allocation.asset.tag,
      employeeId: allocation.employeeId,
      employeeName: allocation.employee?.name || null,
      departmentName: allocation.department?.name || null,
      conditionOnReturn: input.conditionOnReturn,
      inspectorId,
    });

    logger.info(`[Return] Asset ${allocation.asset.tag} returned by ${allocation.employee?.name || allocation.department?.name} with condition ${input.conditionOnReturn}`);

    // ERP Flow Integration: Auto-create maintenance request if returned condition is DAMAGED
    if (input.conditionOnReturn === "DAMAGED") {
      try {
        // Create maintenance request
        const maint = await prisma.maintenanceRequest.create({
          data: {
            assetId: allocation.assetId,
            requestedById: inspectorId,
            description: `Auto-generated maintenance ticket triggered by asset return condition assessment. Notes: ${input.notes || "No remarks provided"}`,
            priority: "HIGH",
            status: "PENDING",
          },
        });
        
        // Lock asset status to UNDER_MAINTENANCE immediately
        await prisma.asset.update({
          where: { id: allocation.assetId },
          data: { status: "UNDER_MAINTENANCE" },
        });

        eventBus.publish("MaintenanceCreated", {
          requestId: maint.id,
          assetId: maint.assetId,
          assetTag: allocation.asset.tag,
          requestedById: maint.requestedById,
          priority: maint.priority,
        });

        logger.info(`[Return] Auto-triggered maintenance request ${maint.id} for damaged returned asset ${allocation.asset.tag}`);
      } catch (err) {
        logger.error("[Return] Failed to auto-trigger maintenance request for damaged asset", err);
      }
    }

    return allocation;
  }
}

export const returnService = new ReturnService();
export default returnService;
