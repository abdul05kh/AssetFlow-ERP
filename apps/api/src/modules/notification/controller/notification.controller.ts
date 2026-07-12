import { Response, NextFunction } from "express";
import { notificationService } from "../service/notification.service";
import { RequestWithCorrelation } from "../../../middlewares/correlation.middleware";

export class NotificationController {
  async list(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const result = await notificationService.list(req.query, userId);

      res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully",
        data: result.items,
        meta: {
          page: parseInt((req.query.page as string) || "1", 10),
          limit: parseInt((req.query.limit as string) || "10", 10),
          totalCount: result.totalCount,
          totalPages: Math.ceil(result.totalCount / parseInt((req.query.limit as string) || "10", 10)),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const result = await notificationService.markAsRead(req.params.id, userId);

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;
