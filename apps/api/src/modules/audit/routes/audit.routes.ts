import { Router } from "express";
import { auditController } from "../controller/audit.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkPermission from "../../../middlewares/permission.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", checkPermission("AUDIT_MANAGE"), auditController.create.bind(auditController));
router.get("/", checkPermission("ASSET_READ"), auditController.list.bind(auditController));
router.get("/:id", checkPermission("ASSET_READ"), auditController.getById.bind(auditController));
router.put("/items/:itemId/verify", checkPermission("AUDIT_EXECUTE"), auditController.verifyItem.bind(auditController));
router.put("/:id/close", checkPermission("AUDIT_EXECUTE"), auditController.close.bind(auditController));

export default router;
