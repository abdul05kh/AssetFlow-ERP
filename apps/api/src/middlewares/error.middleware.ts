import { Response, NextFunction } from "express";
import { RequestWithCorrelation } from "./correlation.middleware";
import { AppError } from "../utils/errors";
import logger from "../utils/logger";

export const errorMiddleware = (
  err: Error,
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.correlationId;
  const path = req.path;
  const method = req.method;

  if (err instanceof AppError) {
    logger.warn(`AppError triggered: [${method}] ${path}`, {
      correlationId,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      message: err.message,
      errors: err.errors,
    });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors.length > 0 ? err.errors : [{ code: err.errorCode, message: err.message }],
    });
  }

  // Unhandled internal server error
  logger.error(`Unhandled system error: [${method}] ${path}`, err, { correlationId });

  res.status(500).json({
    success: false,
    message: "An internal server error occurred",
    errors: [
      {
        code: "INTERNAL_ERROR",
        message: "An internal server error occurred",
      },
    ],
  });
};
