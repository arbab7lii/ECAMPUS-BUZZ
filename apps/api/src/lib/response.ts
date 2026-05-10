import type { Response } from "express";

export function ok<TData>(
  res: Response,
  data: TData,
  meta?: Record<string, unknown>
) {
  return res.json({ success: true as const, data, meta });
}

export function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return res.status(status).json({
    success: false as const,
    error: { code, message, details }
  });
}

