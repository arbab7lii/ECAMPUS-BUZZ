import type { NextFunction, Request, Response } from "express";
import { logger } from "@/lib/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    logger.info("request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100
    });
  });

  next();
}

