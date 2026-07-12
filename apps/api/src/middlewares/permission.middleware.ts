import { Response, NextFunction } from "express";
import { RequestWithCorrelation } from "./correlation.middleware";
import { ForbiddenError } from "../utils/errors";
import { prisma } from "../config/db";

export const checkPermission = (requiredPermission: string) => {
  return async (req: RequestWithCorrelation, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const userRole = req.userRole;

      if (!userId || !userRole) {
        throw new ForbiddenError("Access forbidden: user is not authenticated");
      }

      // Admin has superuser access to bypass individual permission checks
      if (userRole === "ADMIN") {
        return next();
      }

      // Check if user has a role with the required permission
      const hasPermission = await prisma.userRole.findFirst({
        where: {
          userId: userId,
          role: {
            rolePermissions: {
              some: {
                permission: {
                  code: requiredPermission,
                },
              },
            },
          },
        },
      });

      if (!hasPermission) {
        throw new ForbiddenError(`Access forbidden: missing required permission [${requiredPermission}]`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
export default checkPermission;
