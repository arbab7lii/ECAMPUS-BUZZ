import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),
  CORS_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().min(1)
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const err = new Error("Invalid environment configuration");
    (err as any).statusCode = 500;
    (err as any).details = parsed.error.flatten();
    throw err;
  }
  return parsed.data;
}

