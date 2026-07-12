import { Router } from "express";
import { userController } from "../controller/user.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkPermission from "../../../middlewares/permission.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", checkPermission("USER_CREATE"), userController.create.bind(userController));
router.get("/", checkPermission("USER_READ"), userController.list.bind(userController));
router.get("/:id", checkPermission("USER_READ"), userController.getById.bind(userController));
router.put("/:id", checkPermission("USER_UPDATE"), userController.update.bind(userController));
router.put("/:id/promote", checkPermission("USER_UPDATE"), userController.promote.bind(userController));

export default router;
