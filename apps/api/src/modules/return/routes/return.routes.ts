import { Router } from "express";
import { returnController } from "../controller/return.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkPermission from "../../../middlewares/permission.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", checkPermission("ALLOC_RETURN"), returnController.executeReturn.bind(returnController));

export default router;
