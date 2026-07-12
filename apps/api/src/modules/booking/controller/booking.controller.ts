import { Request, Response, NextFunction } from "express";
import { bookingService } from "../service/booking.service";
import { createBookingSchema, approveBookingSchema } from "../validator/booking.validator";
import { ValidationError } from "../../../utils/errors";
import { RequestWithCorrelation } from "../../../middlewares/correlation.middleware";

export class BookingController {
  async create(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const parsed = createBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const employeeId = req.userId!;
      const booking = await bookingService.book(parsed.data, employeeId);

      res.status(210).json({
        success: true,
        message: "Resource reservation request submitted",
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.getById(req.params.id);
      res.status(200).json({
        success: true,
        message: "Booking details retrieved",
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    try {
      const parsed = approveBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", errors);
      }

      const operatorId = req.userId!;
      const operatorRole = req.userRole!;
      
      const booking = await bookingService.approve(req.params.id, parsed.data, operatorRole, operatorId);

      res.status(200).json({
        success: true,
        message: `Booking status updated to ${parsed.data.status}`,
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bookingService.list(req.query);
      res.status(200).json({
        success: true,
        message: "Resource reservations list retrieved",
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

export const bookingController = new BookingController();
export default bookingController;
