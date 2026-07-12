import { Request, Response, NextFunction } from "express";
import { maintenanceService } from "../service/maintenance.service";
import {
  createMaintenanceSchema,
  assignTechnicianSchema,
  resolveMaintenanceSchema,
  closeMaintenanceSchema,
} from "../validator/maintenance.validator";
import { ValidationError, BusinessRuleError } from "../../../utils/errors";
import { RequestWithCorrelation } from "../../../middlewares/correlation.middleware";

export class MaintenanceController {
  async create(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const parsed = createMaintenanceSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const requestedById = req.userId!;
      const request = await maintenanceService.raiseRequest(parsed.data, requestedById);

      res.status(210).json({
        success: true,
        message: "Maintenance request raised successfully",
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await maintenanceService.getById(req.params.id);
      res.status(200).json({
        success: true,
        message: "Maintenance request details retrieved",
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const { approve } = req.body;
      if (typeof approve !== "boolean") {
        throw new ValidationError("Missing or invalid field: approve (must be boolean)");
      }

      const operatorRole = req.userRole!;
      const result = await maintenanceService.approveRequest(req.params.id, approve, operatorRole);

      res.status(200).json({
        success: true,
        message: `Maintenance request status updated to ${result.status}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async assign(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const parsed = assignTechnicianSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const operatorRole = req.userRole!;
      const result = await maintenanceService.assignTechnician(req.params.id, parsed.data, operatorRole);

      res.status(200).json({
        success: true,
        message: "Technician assigned to maintenance request",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async start(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const operatorId = req.userId!;
      const result = await maintenanceService.startWork(req.params.id, operatorId);

      res.status(200).json({
        success: true,
        message: "Maintenance work marked in progress",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async resolve(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const parsed = resolveMaintenanceSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const operatorId = req.userId!;
      const result = await maintenanceService.resolveWork(req.params.id, parsed.data, operatorId);

      res.status(200).json({
        success: true,
        message: "Maintenance request resolved",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async close(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const parsed = closeMaintenanceSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const operatorRole = req.userRole!;
      const result = await maintenanceService.closeRequest(req.params.id, parsed.data, operatorRole);

      res.status(200).json({
        success: true,
        message: "Maintenance request closed and asset released",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await maintenanceService.list(req.query);
      res.status(200).json({
        success: true,
        message: "Maintenance tickets retrieved",
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

export const maintenanceController = new MaintenanceController();
export default maintenanceController;
