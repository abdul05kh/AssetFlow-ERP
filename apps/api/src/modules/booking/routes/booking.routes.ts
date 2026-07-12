import { Router } from "express";
import { bookingController } from "../controller/booking.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkPermission from "../../../middlewares/permission.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", checkPermission("BOOK_CREATE"), bookingController.create.bind(bookingController));
router.get("/", checkPermission("ASSET_READ"), bookingController.list.bind(bookingController));
router.get("/:id", checkPermission("ASSET_READ"), bookingController.getById.bind(bookingController));
router.put("/:id/approve", checkPermission("BOOK_CREATE"), bookingController.approve.bind(bookingController));

export default router;
