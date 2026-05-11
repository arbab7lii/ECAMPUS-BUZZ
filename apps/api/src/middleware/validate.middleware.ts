import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

/** Which slice of the Express request the Zod schema validates against. */
export type ValidateSource = "body" | "query" | "params" | "request";

function pickPayload(req: Request, source: ValidateSource): unknown {
  if (source === "body") return req.body;
  if (source === "query") return req.query;
  if (source === "params") return req.params;
  return {
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers
  };
}

/**
 * Zod validation middleware.
 *
 * @param schema - Schema for the chosen request slice
 * @param source - Defaults to `"body"` (typical JSON POST/PUT payloads).
 *   Use `"request"` when the schema expects `{ body, query, params, headers }`.
 */
export function validate(schema: ZodTypeAny, source: ValidateSource = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(pickPayload(req, source));

    if (!result.success) {
      return next(result.error);
    }

    (req as any).validated = result.data;
    next();
  };
}
