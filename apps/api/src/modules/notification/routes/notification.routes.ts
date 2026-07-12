import { Router } from "express";
import { notificationController } from "../controller/notification.controller";
import authMiddleware from "../../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", notificationController.list.bind(notificationController));
router.put("/read-all", notificationController.markAllAsRead.bind(notificationController));
router.put("/:id/read", notificationController.markAsRead.bind(notificationController));

export default router;
