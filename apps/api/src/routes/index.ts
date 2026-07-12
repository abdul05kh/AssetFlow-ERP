import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes";
import departmentRoutes from "../modules/department/routes/department.routes";
import userRoutes from "../modules/user/routes/user.routes";
import assetRoutes from "../modules/asset/routes/asset.routes";
import allocationRoutes from "../modules/allocation/routes/allocation.routes";
import bookingRoutes from "../modules/booking/routes/booking.routes";
import transferRoutes from "../modules/transfer/routes/transfer.routes";
import returnRoutes from "../modules/return/routes/return.routes";
import maintenanceRoutes from "../modules/maintenance/routes/maintenance.routes";
import auditRoutes from "../modules/audit/routes/audit.routes";
import notificationRoutes from "../modules/notification/routes/notification.routes";
import dashboardRoutes from "../modules/dashboard/routes/dashboard.routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger";

const router = Router();

// API Documentation routes
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
router.get("/docs-json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
});

// Domain Module Routes
router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/users", userRoutes);
router.use("/assets", assetRoutes);
router.use("/allocations", allocationRoutes);
router.use("/bookings", bookingRoutes);
router.use("/transfers", transferRoutes);
router.use("/returns", returnRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/audits", auditRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);

// Health Check Endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "System is responsive and operational",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;
