import { Router } from "express";
import { maintenanceController } from "../controller/maintenance.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkPermission from "../../../middlewares/permission.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", checkPermission("MAINT_REQUEST"), maintenanceController.create.bind(maintenanceController));
router.get("/", checkPermission("ASSET_READ"), maintenanceController.list.bind(maintenanceController));
router.get("/:id", checkPermission("ASSET_READ"), maintenanceController.getById.bind(maintenanceController));
router.put("/:id/approve", checkPermission("MAINT_APPROVE"), maintenanceController.approve.bind(maintenanceController));
router.put("/:id/assign", checkPermission("MAINT_APPROVE"), maintenanceController.assign.bind(maintenanceController));
router.put("/:id/start", checkPermission("MAINT_RESOLVE"), maintenanceController.start.bind(maintenanceController));
router.put("/:id/resolve", checkPermission("MAINT_RESOLVE"), maintenanceController.resolve.bind(maintenanceController));
router.put("/:id/close", checkPermission("MAINT_APPROVE"), maintenanceController.close.bind(maintenanceController));

export default router;
