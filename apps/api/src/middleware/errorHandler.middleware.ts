import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR";

function toErrorCode(status: number): ApiErrorCode {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  return "INTERNAL_SERVER_ERROR";
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Validation failed",
        details: err.flatten()
      }
    });
  }

  const statusCode =
    typeof (err as any)?.statusCode === "number" ? (err as any).statusCode : 500;
  const message =
    typeof (err as any)?.message === "string"
      ? (err as any).message
      : "Unexpected error";

  if (statusCode >= 500) {
    logger.error("Unhandled error", { err });
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: toErrorCode(statusCode),
      message
    }
  });
}

