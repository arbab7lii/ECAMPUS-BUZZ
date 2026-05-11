import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";

import { verifyAccessToken } from "@/lib/jwt";

function unauthorized(message: string): Error {
  const err = new Error(message);
  (err as any).statusCode = 401;
  return err;
}

/**
 * requireAuth middleware
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and attaches the decoded payload to req.user.
 *
 * Usage: router.get('/protected', requireAuth, handler)
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(unauthorized("Authentication required. Please log in."));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role as UserRole
    };
    next();
  } catch (err) {
    const isExpired = (err as Error).name === "TokenExpiredError";
    next(
      unauthorized(
        isExpired
          ? "Your session has expired. Please log in again."
          : "Invalid authentication token."
      )
    );
  }
}

/**
 * optionalAuth middleware
 * Same as requireAuth but doesn't fail if no token is present.
 * Use on routes that behave differently for authenticated vs anonymous users.
 *
 * Usage: router.get('/clubs', optionalAuth, listClubs)
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role as UserRole
    };
  } catch {
    // Token invalid — continue without user (don't throw)
  }

  next();
}
