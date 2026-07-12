import { Request, Response, NextFunction } from "express";
import { allocationService } from "../service/allocation.service";
import { createAllocationSchema } from "../validator/allocation.validator";
import { ValidationError } from "../../../utils/errors";

export class AllocationController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createAllocationSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const allocation = await allocationService.allocate(parsed.data);
      res.status(210).json({
        success: true,
        message: "Asset allocated successfully",
        data: allocation,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await allocationService.getById(req.params.id);
      res.status(200).json({
        success: true,
        message: "Allocation details retrieved",
        data: allocation,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await allocationService.list(req.query);
      res.status(200).json({
        success: true,
        message: "Asset allocations list retrieved",
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

export const allocationController = new AllocationController();
export default allocationController;
