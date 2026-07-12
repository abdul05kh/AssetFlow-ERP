import { Request, Response, NextFunction } from "express";
import { departmentService } from "../service/department.service";
import { createDepartmentSchema, updateDepartmentSchema } from "../validator/department.validator";
import { ValidationError } from "../../../utils/errors";

export class DepartmentController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const department = await departmentService.create(parsed.data);
      res.status(210).json({
        success: true,
        message: "Department created successfully",
        data: department,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.getById(req.params.id);
      res.status(200).json({
        success: true,
        message: "Department details retrieved",
        data: department,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const department = await departmentService.update(req.params.id, parsed.data);
      res.status(200).json({
        success: true,
        message: "Department updated successfully",
        data: department,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await departmentService.list(req.query);
      res.status(200).json({
        success: true,
        message: "Departments list retrieved",
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

export const departmentController = new DepartmentController();
export default departmentController;
