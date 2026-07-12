import eventBus from "../../../events/event-bus";
import { prisma } from "../../../config/db";
import logger from "../../../utils/logger";

export const registerAssetEvents = () => {
  eventBus.subscribe("AssetCreated", async (data: { assetId: string; tag: string; name: string }) => {
    try {
      await prisma.activityLog.create({
        data: {
          action: "CREATE",
          targetType: "Asset",
          targetId: data.assetId,
          currentState: "AVAILABLE",
          remarks: `Asset registered with tag: ${data.tag} and name: ${data.name}`,
        },
      });
      logger.info(`[AssetEvents] Activity log written for Asset creation: ${data.tag}`);
    } catch (err) {
      logger.error("[AssetEvents] Failed to write asset registration log", err);
    }
  });
};
