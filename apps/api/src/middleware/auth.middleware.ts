import type { NextFunction, Request, Response } from "express";

/**
 * Auth middleware scaffold.
 * Phase 1: does not implement auth logic. It only enforces presence of req.user
 * which will be attached by Phase 2 auth implementation.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    const err = new Error("UNAUTHORIZED");
    (err as any).statusCode = 401;
    return next(err);
  }
  next();
}

