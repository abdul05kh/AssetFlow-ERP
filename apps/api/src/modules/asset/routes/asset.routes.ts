import { Router } from "express";
import { assetController } from "../controller/asset.controller";
import authMiddleware from "../../../middlewares/auth.middleware";
import checkPermission from "../../../middlewares/permission.middleware";

const router = Router();

router.use(authMiddleware);

// Categories Endpoints
router.post("/categories", checkPermission("CAT_MANAGE"), assetController.createCategory.bind(assetController));
router.get("/categories", checkPermission("ASSET_READ"), assetController.listCategories.bind(assetController));

// Assets Registry Endpoints
router.post("/", checkPermission("ASSET_CREATE"), assetController.create.bind(assetController));
router.get("/", checkPermission("ASSET_READ"), assetController.list.bind(assetController));
router.get("/:id", checkPermission("ASSET_READ"), assetController.getById.bind(assetController));
router.get("/tag/:tag", checkPermission("ASSET_READ"), assetController.getByTag.bind(assetController));
router.put("/:id", checkPermission("ASSET_UPDATE"), assetController.update.bind(assetController));
router.delete("/:id", checkPermission("ASSET_DELETE"), assetController.delete.bind(assetController));

export default router;
