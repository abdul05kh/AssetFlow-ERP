import eventBus from "../../../events/event-bus";
import { prisma } from "../../../config/db";
import logger from "../../../utils/logger";

export const registerUserEvents = () => {
  eventBus.subscribe("UserCreated", async (data: { userId: string; email: string }) => {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.userId,
          action: "CREATE",
          targetType: "User",
          targetId: data.userId,
          currentState: "CREATED",
          remarks: `User profile created for email: ${data.email}`,
        },
      });
      logger.info(`[UserEvents] Activity log written for User registration: ${data.email}`);
    } catch (err) {
      logger.error("[UserEvents] Failed to write user registration log", err);
    }
  });
};
