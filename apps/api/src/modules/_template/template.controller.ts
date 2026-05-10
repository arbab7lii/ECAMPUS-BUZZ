import type { Request, Response } from "express";
import { ok } from "@/lib/response";
import { asyncHandler } from "@/lib/asyncHandler";

export const templateController = {
  placeholder: asyncHandler(async (_req: Request, res: Response) => {
    ok(res, { status: "scaffold" });
  })
};

