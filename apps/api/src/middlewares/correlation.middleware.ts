import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export interface RequestWithCorrelation extends Request {
  correlationId?: string;
  userId?: string;
  userRole?: string;
}

export const correlationMiddleware = (
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
) => {
  const correlationId = (req.headers["x-correlation-id"] as string) || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  next();
};
