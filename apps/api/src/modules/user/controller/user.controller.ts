import { Request, Response, NextFunction } from "express";
import { userService } from "../service/user.service";
import { createUserSchema, updateUserSchema, promoteUserSchema } from "../validator/user.validator";
import { ValidationError } from "../../../utils/errors";

export class UserController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const user = await userService.create(parsed.data);
      res.status(210).json({
        success: true,
        message: "Employee registered successfully",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(req.params.id);
      res.status(200).json({
        success: true,
        message: "Employee details retrieved",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const user = await userService.update(req.params.id, parsed.data);
      res.status(200).json({
        success: true,
        message: "Employee details updated successfully",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async promote(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = promoteUserSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const user = await userService.promote(req.params.id, parsed.data);
      res.status(200).json({
        success: true,
        message: "Employee promoted successfully",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.list(req.query);
      res.status(200).json({
        success: true,
        message: "Employee directory retrieved",
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

export const userController = new UserController();
export default userController;
