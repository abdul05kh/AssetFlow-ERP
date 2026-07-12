import { Request, Response, NextFunction } from "express";
import { transferService } from "../service/transfer.service";
import { requestTransferSchema, approveTransferSchema } from "../validator/transfer.validator";
import { ValidationError } from "../../../utils/errors";
import { RequestWithCorrelation } from "../../../middlewares/correlation.middleware";

export class TransferController {
  async create(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const parsed = requestTransferSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const requestedById = req.userId!;
      const transfer = await transferService.requestTransfer(parsed.data, requestedById);

      res.status(210).json({
        success: true,
        message: "Asset transfer request submitted successfully",
        data: transfer,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await transferService.getById(req.params.id);
      res.status(200).json({
        success: true,
        message: "Transfer details retrieved",
        data: transfer,
      });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const parsed = approveTransferSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const operatorId = req.userId!;
      const operatorRole = req.userRole!;
      
      const transfer = await transferService.approve(req.params.id, parsed.data, operatorRole, operatorId);

      res.status(200).json({
        success: true,
        message: `Transfer status updated to ${parsed.data.status}`,
        data: transfer,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transferService.list(req.query);
      res.status(200).json({
        success: true,
        message: "Asset transfer requests list retrieved",
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
}

export const transferController = new TransferController();
export default transferController;
