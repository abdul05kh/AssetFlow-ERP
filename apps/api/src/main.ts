import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { env } from "./config/env";
import { correlationMiddleware } from "./middlewares/correlation.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import apiRouter from "./routes/index";
import logger from "./utils/logger";
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

const app = express();

app.use(cors());
app.use(express.json());

// Correlation ID Tracking
app.use(correlationMiddleware);

import { auditContextStorage } from "./utils/context";

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

// Route API Versioning
app.use("/api/v1", apiRouter);

// Global Error Handler Exception Middleware
app.use(errorMiddleware);

app.listen(env.PORT, () => {
  logger.info(`[API] Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
