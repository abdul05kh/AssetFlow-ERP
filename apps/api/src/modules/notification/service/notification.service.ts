import { notificationRepository } from "../repository/notification.repository";
import { NotFoundError } from "../../../utils/errors";
import { prisma } from "../../../config/db";
import { emailService } from "../../../services/email.service";
import logger from "../../../utils/logger";

export class NotificationService {
  async createAndSend(data: { userId: string; message: string; eventType: string; referenceId?: string | null }) {
    // 1. Write notification to database
    const notification = await notificationRepository.create(data);

    // 2. Fetch user to obtain email
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (user && user.email) {
      // 3. Dispatch simulated email via EmailService
      try {
        await emailService.sendEmail({
          to: user.email,
          subject: `AssetFlow Notification: ${data.eventType}`,
          text: `Hi ${user.name},\n\nThis is an automated notification from AssetFlow ERP.\n\n${data.message}\n\nType: ${data.eventType}\nCreated: ${notification.createdAt.toISOString()}`,
          html: `<p>Hi <b>${user.name}</b>,</p><p>This is an automated notification from AssetFlow ERP.</p><p>${data.message}</p><br/><hr/><p>Type: <i>${data.eventType}</i><br/>Created: <i>${notification.createdAt.toISOString()}</i></p>`,
        });
        logger.info(`[Notification] Simulated email dispatched successfully to: ${user.email}`);
      } catch (err) {
        logger.error(`[Notification] Failed to send simulated email to: ${user.email}`, err);
      }
    }

    return notification;
  }

  async list(query: { page?: string; limit?: string; status?: string }, userId: string) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "10", 10);

    let isRead: boolean | undefined;
    if (query.status === "READ") {
      isRead = true;
    } else if (query.status === "UNREAD") {
      isRead = false;
    }

    return notificationRepository.list({
      page,
      limit,
      userId,
      isRead,
    });
  }

  async markAsRead(id: string, userId: string) {
    const record = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!record) {
      throw new NotFoundError("Notification not found");
    }

    return notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
