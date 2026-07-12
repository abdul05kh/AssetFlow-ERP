import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { RequestWithCorrelation } from "./correlation.middleware";
import { AuthenticationError } from "../utils/errors";
import { prisma } from "../config/db";

export const authMiddleware = async (
  req: RequestWithCorrelation,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Authentication token required", "AUTH_001");
    }

    const token = authHeader.split(" ")[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      throw new AuthenticationError("Invalid or expired authentication token", "AUTH_001");
    }

    // Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new AuthenticationError("User session is inactive or disabled", "AUTH_003");
    }

    // Bind fields to request
    req.userId = user.id;
    req.userRole = decoded.role;

    next();
  } catch (err) {
    next(err);
  }
};
export default authMiddleware;
