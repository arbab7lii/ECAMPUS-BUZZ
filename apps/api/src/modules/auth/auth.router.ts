import { Router } from "express";
import rateLimit from "express-rate-limit";

import { validate } from "@/middleware/validate.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { loginSchema, registerSchema } from "./auth.schema";
import { getMe, login, logout, refresh, register } from "./auth.controller";

export const authRouter = Router();

// ─── Route-Specific Rate Limiters ─────────────────────────────────────────────

/** Very strict limit for registration — prevent mass account creation */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  message: {
    success: false,
    message: "Too many registration attempts. Try again in an hour."
  },
  standardHeaders: "draft-7",
  legacyHeaders: false
});

/** Strict limit for login — prevent brute force */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  message: {
    success: false,
    message: "Too many login attempts. Please wait 15 minutes."
  },
  standardHeaders: "draft-7",
  legacyHeaders: false
});

/** Moderate limit for token refresh */
const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 50,
  message: { success: false, message: "Too many refresh attempts." },
  standardHeaders: "draft-7",
  legacyHeaders: false
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
authRouter.post("/register", registerLimiter, validate(registerSchema), register);

// POST /api/v1/auth/login
authRouter.post("/login", loginLimiter, validate(loginSchema), login);

// POST /api/v1/auth/logout
authRouter.post("/logout", requireAuth, logout);

// POST /api/v1/auth/refresh
authRouter.post("/refresh", refreshLimiter, refresh);

// GET /api/v1/auth/me
authRouter.get("/me", requireAuth, getMe);

