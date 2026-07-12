import { Router } from "express";
import { transferController } from "../controller/transfer.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkPermission from "../../../middlewares/permission.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", checkPermission("TRANSFER_REQUEST"), transferController.create.bind(transferController));
router.get("/", checkPermission("ASSET_READ"), transferController.list.bind(transferController));
router.get("/:id", checkPermission("ASSET_READ"), transferController.getById.bind(transferController));
router.put("/:id/approve", checkPermission("TRANSFER_APPROVE"), transferController.approve.bind(transferController));

export default router;
