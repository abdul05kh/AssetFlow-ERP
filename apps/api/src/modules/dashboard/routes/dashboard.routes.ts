import { Router } from "express";
import { dashboardController } from "../controller/dashboard.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkPermission from "../../../middlewares/permission.middleware";

const router = Router();

router.use(authMiddleware);

// Dashboard routes
router.get("/stats", checkPermission("REPORTS_VIEW"), dashboardController.getStats.bind(dashboardController));

// Reports export routes
router.get("/reports/assets/export", checkPermission("REPORTS_VIEW"), dashboardController.exportAssetsCsv.bind(dashboardController));
router.get("/reports/maintenance/export", checkPermission("REPORTS_VIEW"), dashboardController.exportMaintenanceCsv.bind(dashboardController));

export default router;
