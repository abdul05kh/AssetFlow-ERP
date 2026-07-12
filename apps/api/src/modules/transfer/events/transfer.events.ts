import eventBus from "../../../events/event-bus";
import { prisma } from "../../../config/db";
import logger from "../../../utils/logger";

export const registerTransferEvents = () => {
  eventBus.subscribe("TransferApproved", async (data: {
    transferId: string;
    assetId: string;
    assetTag: string;
    currentHolderId: string;
    targetHolderId: string;
    currentHolderName: string;
    targetHolderName: string;
  }) => {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.targetHolderId,
          action: "TRANSFER",
          targetType: "Asset",
          targetId: data.assetId,
          currentState: "ALLOCATED",
          remarks: `Asset ${data.assetTag} ownership transferred from ${data.currentHolderName} to ${data.targetHolderName}. Transfer ID: ${data.transferId}`,
        },
      });
      logger.info(`[TransferEvents] Activity log written for Asset transfer approval: ${data.assetTag}`);
    } catch (err) {
      logger.error("[TransferEvents] Failed to write asset transfer log", err);
    }
  });
};
