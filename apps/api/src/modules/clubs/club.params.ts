import type { Request } from "express";

function paramString(value: string | string[] | undefined, label: string): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  const err = new Error(`Invalid ${label}`);
  (err as any).statusCode = 400;
  throw err;
}

export function clubIdParam(req: Request): string {
  return paramString(req.params.id, "club id");
}

export function clubSlugParam(req: Request): string {
  return paramString(req.params.slug, "club slug");
}

export function memberUserIdParam(req: Request): string {
  return paramString(req.params.userId, "user id");
}
