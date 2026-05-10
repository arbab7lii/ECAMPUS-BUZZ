import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      const err = new Error("UNAUTHORIZED");
      (err as any).statusCode = 401;
      return next(err);
    }

    if (!roles.includes(req.user.role)) {
      const err = new Error("FORBIDDEN");
      (err as any).statusCode = 403;
      return next(err);
    }

    next();
  };
}

