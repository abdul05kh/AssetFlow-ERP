import { Request, Response, NextFunction } from "express";
import { returnService } from "../service/return.service";
import { returnAssetSchema } from "../validator/return.validator";
import { ValidationError } from "../../../utils/errors";
import { RequestWithCorrelation } from "../../../middlewares/correlation.middleware";

export class ReturnController {
  async executeReturn(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const parsed = returnAssetSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const inspectorId = req.userId!;
      const result = await returnService.returnAsset(parsed.data, inspectorId);

      res.status(200).json({
        success: true,
        message: "Asset returned successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const returnController = new ReturnController();
export default returnController;
