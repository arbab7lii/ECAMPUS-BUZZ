import jwt, { type Secret } from "jsonwebtoken";

export type AccessTokenPayload = {
  userId: string;
  role: string;
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

/**
 * Verifies a JWT access token issued by the auth service.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, mustGetEnv("JWT_ACCESS_SECRET") as Secret) as AccessTokenPayload;
}
