import { prisma } from "../../../config/db";

export class NotificationRepository {
  async create(data: { userId: string; message: string; eventType: string; referenceId?: string | null }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        message: data.message,
        eventType: data.eventType,
        referenceId: data.referenceId || null,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.update({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async list(params: { page: number; limit: number; userId: string; isRead?: boolean }) {
    const { page, limit, userId, isRead } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (isRead !== undefined) where.isRead = isRead;

    const [items, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      items,
      totalCount,
    };
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
