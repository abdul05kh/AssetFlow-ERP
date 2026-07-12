import eventBus from "../../../events/event-bus";
import { prisma } from "../../../config/db";
import logger from "../../../utils/logger";

export const registerAuthEvents = () => {
  eventBus.subscribe("UserLoggedIn", async (data: { userId: string; email: string }) => {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.userId,
          action: "LOGIN",
          targetType: "User",
          targetId: data.userId,
          currentState: "LOGGED_IN",
          remarks: `User ${data.email} authenticated successfully`,
        },
      });
      logger.info(`[AuthEvents] Login log written for: ${data.email}`);
    } catch (err) {
      logger.error("[AuthEvents] Failed to write login activity log", err);
    }
  });
};
