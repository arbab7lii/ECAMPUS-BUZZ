import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { authRepository } from "./auth.repository";
import type { SafeUser } from "./auth.repository";
import type { LoginInput, RegisterInput } from "./auth.schema";

const BCRYPT_SALT_ROUNDS = 12;

type JwtPayload = {
  userId: string;
  role: string;
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    const err = new Error(`Missing environment variable: ${name}`);
    (err as any).statusCode = 500;
    throw err;
  }
  return v;
}

function signAccessToken(payload: JwtPayload): string {
  const secret = mustGetEnv("JWT_ACCESS_SECRET") as Secret;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES ?? "15m") as any
  };
  return jwt.sign(payload, secret, options);
}

function signRefreshToken(payload: JwtPayload): string {
  const secret = mustGetEnv("JWT_REFRESH_SECRET") as Secret;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES ?? "7d") as any
  };
  return jwt.sign(payload, secret, options);
}

function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, mustGetEnv("JWT_REFRESH_SECRET")) as JwtPayload;
}

function appError(statusCode: number, message: string): Error {
  const err = new Error(message);
  (err as any).statusCode = statusCode;
  return err;
}

// ─── Token Payload Shape ──────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const exists = await authRepository.emailExists(input.email);
    if (exists) {
      throw appError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    const user = await authRepository.create({
      name: input.name,
      email: input.email,
      passwordHash
    });

    const tokens = generateTokenPair(user.id, user.role);

    return { user, tokens };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const userWithHash = await authRepository.findByEmail(input.email);

    // Timing-attack mitigation: always run bcrypt.compare
    const dummyHash =
      "$2b$12$invalidhashfortimingnormalizationinvalidhashfortimingno";
    const passwordHash = userWithHash?.passwordHash ?? dummyHash;

    const passwordValid = await bcrypt.compare(input.password, passwordHash);

    if (!userWithHash || !passwordValid) {
      throw appError(401, "Invalid email or password");
    }

    const user = await authRepository.findById(userWithHash.id);
    if (!user) {
      throw appError(401, "Invalid email or password");
    }

    const tokens = generateTokenPair(user.id, user.role);
    return { user, tokens };
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw appError(
        401,
        "Invalid or expired refresh token. Please log in again."
      );
    }

    const user = await authRepository.findById(payload.userId);
    if (!user) {
      throw appError(401, "Account not found. Please log in again.");
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    return { accessToken };
  },

  async getMe(userId: string): Promise<SafeUser> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw appError(404, "User not found");
    }
    return user;
  }
};

// ─── Private Helpers ──────────────────────────────────────────────────────────

function generateTokenPair(userId: string, role: string): AuthTokens {
  return {
    accessToken: signAccessToken({ userId, role }),
    refreshToken: signRefreshToken({ userId, role })
  };
}

