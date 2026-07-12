import { Request, Response, NextFunction } from "express";
import { auditService } from "../service/audit.service";
import { createAuditSchema, verifyAuditItemSchema } from "../validator/audit.validator";
import { ValidationError } from "../../../utils/errors";
import { RequestWithCorrelation } from "../../../middlewares/correlation.middleware";

export class AuditController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createAuditSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const audit = await auditService.createCycle(parsed.data);
      res.status(210).json({
        success: true,
        message: "Audit cycle initiated successfully",
        data: audit,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const audit = await auditService.getById(req.params.id);
      res.status(200).json({
        success: true,
        message: "Audit cycle details retrieved",
        data: audit,
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyItem(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const parsed = verifyAuditItemSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const operatorId = req.userId!;
      const result = await auditService.verifyItem(req.params.itemId, parsed.data, operatorId);

      res.status(200).json({
        success: true,
        message: "Audit item verified successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async close(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const operatorId = req.userId!;
      const result = await auditService.closeCycle(req.params.id, operatorId);

      res.status(200).json({
        success: true,
        message: "Audit cycle closed successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await auditService.list(req.query);
      res.status(200).json({
        success: true,
        message: "Audit cycles list retrieved",
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

export const auditController = new AuditController();
export default auditController;
