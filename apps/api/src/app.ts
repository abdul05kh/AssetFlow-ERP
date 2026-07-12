import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { env } from "./config/env";
import { correlationMiddleware } from "./middlewares/correlation.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import apiRouter from "./routes/index";
import { registerAuthEvents } from "./modules/auth/events/auth.events";
import { registerUserEvents } from "./modules/user/events/user.events";
import { registerAssetEvents } from "./modules/asset/events/asset.events";
import { registerAllocationEvents } from "./modules/allocation/events/allocation.events";
import { registerBookingEvents } from "./modules/booking/events/booking.events";
import { registerTransferEvents } from "./modules/transfer/events/transfer.events";
import { registerReturnEvents } from "./modules/return/events/return.events";
import { registerMaintenanceEvents } from "./modules/maintenance/events/maintenance.events";
import { registerAuditEvents } from "./modules/audit/events/audit.events";
import { registerNotificationEvents } from "./modules/notification/events/notification.events";
import { auditContextStorage } from "./utils/context";

// Initialize Event Listeners
registerAuthEvents();
registerUserEvents();
registerAssetEvents();
registerAllocationEvents();
registerBookingEvents();
registerTransferEvents();
registerReturnEvents();
registerMaintenanceEvents();
registerAuditEvents();
registerNotificationEvents();

export const app = express();

app.use(cors());
app.use(express.json());

// Correlation ID Tracking
app.use(correlationMiddleware);

// Global Audit Context Storage Middleware
app.use((req: any, res, next) => {
  const store = {
    get userId() { return req.userId || null; },
    get ipAddress() { return req.ip || null; },
    get userAgent() { return req.headers["user-agent"] || null; },
    get correlationId() { return req.correlationId || null; }
  };
  auditContextStorage.run(store, next);
});

// Security Headers Hardening Middleware
app.use((req, res, next) => {
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// Serve uploads static folder
const uploadDir = path.resolve(env.LOCAL_UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// GET /health for CI validation readiness checks
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET /api/v1/metrics for queue and query telemetry
import { jobQueue } from "./utils/job-queue";
import { dbMetrics } from "./config/db";
app.get("/api/v1/metrics", (req, res) => {
  res.json({
    status: "ok",
    queue: jobQueue.getMetrics(),
    database: {
      totalQueries: dbMetrics.totalQueries,
      totalReads: dbMetrics.totalReads,
      totalWrites: dbMetrics.totalWrites,
      averageDurationMs: dbMetrics.totalQueries > 0
        ? parseFloat((dbMetrics.totalDurationMs / dbMetrics.totalQueries).toFixed(2))
        : 0,
      slowestQueries: dbMetrics.slowestQueries,
    }
  });
});

// Route API Versioning
app.use("/api/v1", apiRouter);

// Global Error Handler Exception Middleware
app.use(errorMiddleware);

export default app;
