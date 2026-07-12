import { Request, Response, NextFunction } from "express";
import { assetService } from "../service/asset.service";
import { createCategorySchema, createAssetSchema, updateAssetSchema } from "../validator/asset.validator";
import { ValidationError } from "../../../utils/errors";

export class AssetController {
  // -------------------------------------------------------------
  // CATEGORIES CONTROLLERS
  // -------------------------------------------------------------

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const category = await assetService.createCategory(parsed.data);
      res.status(210).json({
        success: true,
        message: "Asset category created successfully",
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await assetService.listCategories();
      res.status(200).json({
        success: true,
        message: "Asset categories list retrieved",
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  // -------------------------------------------------------------
  // ASSET REGISTRY CONTROLLERS
  // -------------------------------------------------------------

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createAssetSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const asset = await assetService.createAsset(parsed.data);
      res.status(210).json({
        success: true,
        message: "Asset registered successfully",
        data: asset,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const asset = await assetService.getAssetById(req.params.id);
      res.status(200).json({
        success: true,
        message: "Asset details retrieved",
        data: asset,
      });
    } catch (err) {
      next(err);
    }
  }

  async getByTag(req: Request, res: Response, next: NextFunction) {
    try {
      const asset = await assetService.getAssetByTag(req.params.tag);
      res.status(200).json({
        success: true,
        message: "Asset details retrieved by tag lookup",
        data: asset,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateAssetSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const asset = await assetService.updateAsset(req.params.id, parsed.data);
      res.status(200).json({
        success: true,
        message: "Asset details updated successfully",
        data: asset,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assetService.listAssets(req.query);
      res.status(200).json({
        success: true,
        message: "Asset inventory list retrieved",
        data: result.items,
        meta: {
          page: parseInt((req.query.page as string) || "1", 10),
          limit: parseInt((req.query.limit as string) || "10", 10),
          totalCount: result.totalCount,
          totalPages: Math.ceil(result.totalCount / parseInt((req.query.limit as string) || "10", 10)),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await assetService.deleteAsset(req.params.id);
      res.status(200).json({
        success: true,
        message: "Asset record deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

export const assetController = new AssetController();
export default assetController;
