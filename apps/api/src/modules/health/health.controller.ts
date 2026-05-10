import type { Request, Response } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import { ok } from "@/lib/response";

export const healthController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    ok(res, { ok: true });
  })
};

