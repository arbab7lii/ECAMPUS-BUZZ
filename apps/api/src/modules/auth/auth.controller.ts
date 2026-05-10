import type { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service";
import type { LoginInput, RegisterInput } from "./auth.schema";

// ─── Cookie Config ────────────────────────────────────────────────────────────

const REFRESH_TOKEN_COOKIE = "ecampus_refresh_token";
const isProd = process.env.NODE_ENV === "production";

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth"
};

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Creates a new student account.
 */
export async function register(
  req: Request<object, object, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, tokens } = await authService.register(req.body);

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshCookieOptions);

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken
      },
      message: "Account created successfully"
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 * Authenticates a user and returns tokens.
 */
export async function login(
  req: Request<object, object, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, tokens } = await authService.login(req.body);

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshCookieOptions);

    res.json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken
      },
      message: "Logged in successfully"
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout
 * Clears the refresh token cookie.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/v1/auth"
  });

  res.json({
    success: true,
    data: null,
    message: "Logged out successfully"
  });
}

/**
 * POST /api/v1/auth/refresh
 * Issues a new access token using the refresh token from the cookie.
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken =
      (req.cookies as Record<string, string | undefined>)?.[
        REFRESH_TOKEN_COOKIE
      ] ?? (req.body as { refreshToken?: string }).refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: "No refresh token provided. Please log in."
      });
      return;
    }

    const { accessToken } = await authService.refresh(refreshToken);

    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
}

