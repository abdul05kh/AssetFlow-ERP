import { Request, Response, NextFunction } from "express";
import { authService } from "../service/auth.service";
import { loginSchema } from "../validator/auth.validator";
import { ValidationError } from "../../../utils/errors";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      
      if (!parsed.success) {
        // Build clear structured validation errors list
        const formattedErrors = parsed.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new ValidationError("Validation failed", formattedErrors);
      }

      const result = await authService.login(parsed.data);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
export default authController;
