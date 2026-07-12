import { Router } from "express";
import { departmentController } from "../controller/department.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkPermission from "../../../middlewares/permission.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", checkPermission("DEPT_MANAGE"), departmentController.create.bind(departmentController));
router.get("/", checkPermission("USER_READ"), departmentController.list.bind(departmentController));
router.get("/:id", checkPermission("USER_READ"), departmentController.getById.bind(departmentController));
router.put("/:id", checkPermission("DEPT_MANAGE"), departmentController.update.bind(departmentController));

export default router;
