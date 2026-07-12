import { Router } from "express";
import { allocationController } from "../controller/allocation.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkPermission from "../../../middlewares/permission.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", checkPermission("ALLOC_MANAGE"), allocationController.create.bind(allocationController));
router.get("/", checkPermission("ASSET_READ"), allocationController.list.bind(allocationController));
router.get("/:id", checkPermission("ASSET_READ"), allocationController.getById.bind(allocationController));

export default router;
