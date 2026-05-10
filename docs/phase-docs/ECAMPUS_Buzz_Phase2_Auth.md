# ECAMPUS Buzz — Phase 2: Authentication System
**Complete Implementation Guide — Sequential, Cursor-Safe**
*Built on Phase 1 infrastructure. Do not modify existing files unless explicitly instructed.*

---

## READING THIS DOCUMENT

Each step is numbered and self-contained. Complete them **in order**. Each step tells you:
- 📁 **Where** the file lives in the project
- 🔧 **What** to create or modify
- ⚠️ **What not to touch**

Backend steps come first (Steps 1–7), then frontend (Steps 8–17), then wiring (Steps 18–20).

**Exit criteria for this phase:**
- `POST /api/v1/auth/register` creates a user with hashed password
- `POST /api/v1/auth/login` returns access + refresh tokens
- `GET /api/v1/auth/me` returns the current user (JWT protected)
- `POST /api/v1/auth/refresh` issues a new access token via httpOnly cookie
- `POST /api/v1/auth/logout` clears the session
- Login and Register pages are animated, validated, and functional
- Protected routes (`/home`, `/clubs`, etc.) redirect unauthenticated users to `/login`
- Auth state persists across page refresh

---

## PHASE 2 FILE MAP

Files you will **create** in this phase:

```
apps/api/src/
├── modules/
│   └── auth/
│       ├── auth.schema.ts          ← NEW
│       ├── auth.repository.ts      ← NEW
│       ├── auth.service.ts         ← NEW
│       ├── auth.controller.ts      ← NEW
│       └── auth.router.ts          ← NEW
└── middleware/
    └── rateLimit.middleware.ts     ← NEW (dedicated rate limit configs)

apps/api/src/app.ts                 ← MODIFY (mount auth router)

apps/web/src/
├── lib/
│   ├── motion.ts                   ← NEW (shared Framer Motion variants)
│   ├── validators/
│   │   └── auth.schema.ts          ← NEW (client-side Zod mirrors)
│   └── constants.ts                ← NEW
├── store/
│   ├── auth.store.ts               ← REPLACE (full implementation)
│   ├── ui.store.ts                 ← NEW
│   └── notifications.store.ts      ← NEW
├── hooks/
│   └── useAuth.ts                  ← NEW
├── components/
│   ├── ui/
│   │   ├── Button.tsx              ← NEW (full design system Button)
│   │   ├── Input.tsx               ← NEW (full design system Input)
│   │   └── FormField.tsx           ← NEW
│   └── auth/
│       ├── LoginForm.tsx           ← NEW
│       └── RegisterForm.tsx        ← NEW
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              ← REPLACE (full animated layout)
│   │   ├── login/page.tsx          ← REPLACE (full implementation)
│   │   └── register/page.tsx       ← REPLACE (full implementation)
│   └── (app)/
│       └── layout.tsx              ← MODIFY (add auth guard)
└── middleware.ts                   ← NEW (Next.js route protection)
```

---

## ═══════════════════════════════════════════
## BACKEND IMPLEMENTATION (Steps 1–7)
## ═══════════════════════════════════════════

---

## STEP 1 — Install Backend Auth Dependencies

**Run from:** `apps/api/`

```bash
cd apps/api

# Core auth packages (some may already be installed from Phase 1)
npm install bcryptjs jsonwebtoken cookie-parser
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/cookie-parser

cd ../..
```

Then add `cookie-parser` to your Express app.

**File to MODIFY:** `apps/api/src/app.ts`

Find the line where you import and add after other imports:
```typescript
import cookieParser from 'cookie-parser';
```

Then add this line **before** your routes but **after** `express.json()`:
```typescript
app.use(cookieParser());
```

---

## STEP 2 — Auth Zod Schemas

**Create file:** `apps/api/src/modules/auth/auth.schema.ts`

This file defines the validation rules for all auth endpoints. Every field is validated before it reaches the service layer.

```typescript
import { z } from 'zod';

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters')
    .trim(),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshTokenSchema = z.object({
  // refreshToken can come from cookie (preferred) or body (fallback)
  refreshToken: z.string().optional(),
});

// ─── TypeScript Inferred Types ────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

---

## STEP 3 — Auth Repository

**Create file:** `apps/api/src/modules/auth/auth.repository.ts`

The repository is the only layer that talks to Prisma. Service layer calls repository. Controller calls service. This separation means if you ever swap the ORM, you only change this file.

```typescript
import { prisma } from '../../lib/prisma';
import type { User, UserRole } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

/** The safe user object — never includes passwordHash */
export type SafeUser = Omit<User, 'passwordHash'>;

// ─── Repository ───────────────────────────────────────────────────────────────

export const authRepository = {
  /**
   * Find a user by email.
   * Returns the full record including passwordHash (needed for login comparison).
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Find a user by ID.
   * Returns safe user (no passwordHash).
   */
  async findById(id: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Create a new user.
   * Accepts pre-hashed password.
   */
  async create(data: CreateUserData): Promise<SafeUser> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        // role defaults to STUDENT via Prisma schema default
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Check if an email is already registered.
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },

  /**
   * Update user profile.
   */
  async updateById(id: string, data: Partial<Pick<User, 'name' | 'avatar' | 'bio'>>): Promise<SafeUser> {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
```

---

## STEP 4 — Auth Service

**Create file:** `apps/api/src/modules/auth/auth.service.ts`

The service contains all business logic. It uses the repository and the JWT/bcrypt utilities. Controllers call this — never call Prisma directly from controllers.

```typescript
import bcrypt from 'bcryptjs';
import { authRepository } from './auth.repository';
import type { SafeUser } from './auth.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { AppError } from '../../middleware/errorHandler.middleware';
import type { RegisterInput, LoginInput } from './auth.schema';

const BCRYPT_SALT_ROUNDS = 12; // Higher = slower = more secure. 12 is the production standard.

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
  /**
   * Register a new student account.
   * Hashes the password, creates the user, returns tokens.
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    // Check for duplicate email
    const exists = await authRepository.emailExists(input.email);
    if (exists) {
      // Use 409 Conflict — not 400. The input is valid; the conflict is the issue.
      throw new AppError(409, 'An account with this email already exists');
    }

    // Hash password — bcrypt automatically generates a salt
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    // Create user
    const user = await authRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    // Issue tokens
    const tokens = generateTokenPair(user.id, user.role);

    return { user, tokens };
  },

  /**
   * Login with email and password.
   * Returns user + tokens on success. Throws on invalid credentials.
   */
  async login(input: LoginInput): Promise<AuthResult> {
    // Fetch user including passwordHash (findByEmail returns full record)
    const userWithHash = await authRepository.findByEmail(input.email);

    // SECURITY: Always run bcrypt.compare even if user not found.
    // This prevents timing attacks that reveal whether an email is registered.
    const dummyHash = '$2b$12$invalidhashfortimingnormalization'; // bcrypt format
    const passwordHash = userWithHash?.passwordHash ?? dummyHash;

    const passwordValid = await bcrypt.compare(input.password, passwordHash);

    if (!userWithHash || !passwordValid) {
      // Use same message for both cases — never reveal which field was wrong
      throw new AppError(401, 'Invalid email or password');
    }

    // Build safe user (strip passwordHash)
    const user: SafeUser = {
      id: userWithHash.id,
      name: userWithHash.name,
      email: userWithHash.email,
      role: userWithHash.role,
      avatar: userWithHash.avatar,
      bio: userWithHash.bio,
      createdAt: userWithHash.createdAt,
      updatedAt: userWithHash.updatedAt,
    };

    const tokens = generateTokenPair(user.id, user.role);

    return { user, tokens };
  },

  /**
   * Verify a refresh token and issue a new access token.
   * Called by the frontend token refresh interceptor.
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token. Please log in again.');
    }

    // Verify user still exists and is not suspended
    const user = await authRepository.findById(payload.userId);
    if (!user) {
      throw new AppError(401, 'Account not found. Please log in again.');
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    return { accessToken };
  },

  /**
   * Get the authenticated user's profile.
   */
  async getMe(userId: string): Promise<SafeUser> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user;
  },
};

// ─── Private Helpers ──────────────────────────────────────────────────────────

function generateTokenPair(userId: string, role: string): AuthTokens {
  return {
    accessToken: signAccessToken({ userId, role }),
    refreshToken: signRefreshToken({ userId, role }),
  };
}
```

---

## STEP 5 — Auth Controller

**Create file:** `apps/api/src/modules/auth/auth.controller.ts`

Controllers handle HTTP concerns only: read from `req`, call the service, write to `res`. No business logic here.

```typescript
import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import type { RegisterInput, LoginInput } from './auth.schema';

// ─── Cookie Config ────────────────────────────────────────────────────────────

const REFRESH_TOKEN_COOKIE = 'ecampus_refresh_token';
const isProd = process.env.NODE_ENV === 'production';

const refreshCookieOptions = {
  httpOnly: true,           // JS cannot access this cookie — XSS protection
  secure: isProd,           // HTTPS only in production
  sameSite: 'lax' as const, // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/api/v1/auth',    // Cookie only sent to auth routes (least privilege)
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

    // Store refresh token in httpOnly cookie
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshCookieOptions);

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
        // NOTE: refresh token is in the cookie, NOT in the response body
      },
      message: 'Account created successfully',
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
        accessToken: tokens.accessToken,
      },
      message: 'Logged in successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout
 * Clears the refresh token cookie. JWT access tokens are stateless
 * so they expire naturally — we can't "revoke" them without a blocklist.
 */
export async function logout(
  _req: Request,
  res: Response
): Promise<void> {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/v1/auth',
  });

  res.json({
    success: true,
    data: null,
    message: 'Logged out successfully',
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
    // Read from cookie first, fallback to body (for clients without cookie support)
    const refreshToken =
      (req.cookies as Record<string, string | undefined>)[REFRESH_TOKEN_COOKIE] ??
      (req.body as { refreshToken?: string }).refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'No refresh token provided. Please log in.',
      });
      return;
    }

    const { accessToken } = await authService.refresh(refreshToken);

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 * Requires JWT middleware (req.user will be set).
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
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
```

---

## STEP 6 — Auth Router

**Create file:** `apps/api/src/modules/auth/auth.router.ts`

Wires the routes with rate limiting and validation middleware.

```typescript
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { register, login, logout, refresh, getMe } from './auth.controller';
import { registerSchema, loginSchema } from './auth.schema';
import { validate } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';

export const authRouter = Router();

// ─── Route-Specific Rate Limiters ─────────────────────────────────────────────

/** Very strict limit for registration — prevent mass account creation */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'Too many registration attempts. Try again in an hour.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

/** Strict limit for login — prevent brute force */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

/** Moderate limit for token refresh */
const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { success: false, message: 'Too many refresh attempts.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
authRouter.post('/register', registerLimiter, validate(registerSchema), register);

// POST /api/v1/auth/login
authRouter.post('/login', loginLimiter, validate(loginSchema), login);

// POST /api/v1/auth/logout  (requireAuth ensures only logged-in users can logout)
authRouter.post('/logout', requireAuth, logout);

// POST /api/v1/auth/refresh
authRouter.post('/refresh', refreshLimiter, refresh);

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, getMe);
```

---

## STEP 7 — Mount Auth Router in app.ts

**Modify file:** `apps/api/src/app.ts`

Find the routes section and add the auth router. Your routes section should look like this after the change:

```typescript
// Add this import at the top of app.ts:
import { authRouter } from './modules/auth/auth.router';

// In your routes section, replace the placeholder and add:
app.use('/health', healthRouter);
app.use('/api/v1/auth', authRouter);
// Future: app.use('/api/v1/clubs', clubsRouter);
// Future: app.use('/api/v1/posts', postsRouter);
// etc.
```

Also update `auth.middleware.ts` to fully implement JWT verification (replace the placeholder from Phase 1):

**Replace file:** `apps/api/src/middleware/auth.middleware.ts`
```typescript
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { AppError } from './errorHandler.middleware';
import type { UserRole } from '@prisma/client';

/**
 * requireAuth middleware
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and attaches the decoded payload to req.user.
 *
 * Usage: router.get('/protected', requireAuth, handler)
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication required. Please log in.'));
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role as UserRole,
    };
    next();
  } catch (err) {
    // jsonwebtoken throws TokenExpiredError or JsonWebTokenError
    const isExpired = (err as Error).name === 'TokenExpiredError';
    next(
      new AppError(
        401,
        isExpired
          ? 'Your session has expired. Please log in again.'
          : 'Invalid authentication token.'
      )
    );
  }
}

/**
 * optionalAuth middleware
 * Same as requireAuth but doesn't fail if no token is present.
 * Use on routes that behave differently for authenticated vs anonymous users.
 *
 * Usage: router.get('/clubs', optionalAuth, listClubs)
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(); // Continue without user
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role as UserRole,
    };
  } catch {
    // Token invalid — continue without user (don't throw)
  }

  next();
}
```

### Verify the backend works

```bash
# Start the API
cd apps/api && npm run dev

# Test register (in another terminal)
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Password123"}'

# Expected: { "success": true, "data": { "user": {...}, "accessToken": "..." } }

# Test login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123"}'

# Test /me with the token from login response
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## ═══════════════════════════════════════════
## FRONTEND IMPLEMENTATION (Steps 8–17)
## ═══════════════════════════════════════════

---

## STEP 8 — Install Frontend Auth Dependencies

**Run from:** `apps/web/`

```bash
cd apps/web

npm install react-hook-form @hookform/resolvers zod

cd ../..
```

> `react-hook-form` handles form state. `@hookform/resolvers` connects it to Zod. Both are already in your Tailwind + shadcn setup — this ensures they're explicitly installed.

---

## STEP 9 — Shared Motion Variants Library

**Create file:** `apps/web/src/lib/motion.ts`

This is the centralized Framer Motion variant library from the architecture doc. Every animated component imports from here — no inline variant definitions.

```typescript
import type { Variants } from 'framer-motion';

// ─── Page / Section Transitions ───────────────────────────────────────────────

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── List / Stagger Containers ────────────────────────────────────────────────

export const staggerContainer: Variants = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const staggerFast: Variants = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

// ─── Card Interactions ────────────────────────────────────────────────────────

export const cardHover = {
  whileHover: { y: -4, scale: 1.01 },
  transition: { type: 'spring', stiffness: 400, damping: 25 },
};

// ─── Modal / Drawer ───────────────────────────────────────────────────────────

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 10,
    transition: { duration: 0.18 },
  },
};

export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ─── Polls ───────────────────────────────────────────────────────────────────

export const pollBarVariants: Variants = {
  initial: { width: '0%' },
  animate: (pct: number) => ({
    width: `${pct}%`,
    transition: { duration: 0.8, ease: 'easeOut', delay: 0.2 },
  }),
};

// ─── Glow Pulse (for notification badges, active elements) ───────────────────

export const glowPulse: Variants = {
  animate: {
    boxShadow: [
      '0 0 0px rgba(99, 102, 241, 0)',
      '0 0 20px rgba(99, 102, 241, 0.4)',
      '0 0 0px rgba(99, 102, 241, 0)',
    ],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Auth Form Specific ───────────────────────────────────────────────────────

export const authFormVariants: Variants = {
  initial: { opacity: 0, y: 32, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const authFieldVariants: Variants = {
  initial: { opacity: 0, x: -12 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── Error Shake ─────────────────────────────────────────────────────────────

export const shakeVariants: Variants = {
  shake: {
    x: [-8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.4 },
  },
};
```

---

## STEP 10 — Client-Side Zod Validation Schemas

**Create file:** `apps/web/src/lib/validators/auth.schema.ts`

These mirror the backend schemas exactly. Client validates first (instant UX feedback), backend validates again (security). Never trust client-only validation.

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters')
    .trim(),

  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Must include uppercase, lowercase, and a number'
    ),

  confirmPassword: z.string({ required_error: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
```

---

## STEP 11 — Constants

**Create file:** `apps/web/src/lib/constants.ts`

```typescript
export const APP_NAME = 'ECAMPUS Buzz';

export const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
  REGISTER: '/register',
  CLUBS: '/clubs',
  EVENTS: '/events',
  POLLS: '/polls',
  NOTIFICATIONS: '/notifications',
  SAVED: '/saved',
  PROFILE: '/profile',
  ADMIN: '/admin',
} as const;

/** Routes that don't require authentication */
export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
] as const;

/** Routes only accessible to SUPER_ADMIN */
export const ADMIN_ROUTES = [ROUTES.ADMIN] as const;

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
} as const;

/** Token storage key in memory — we use memory not localStorage for security */
export const ACCESS_TOKEN_KEY = 'ecampus_access_token';
```

---

## STEP 12 — Full Auth Store (Zustand)

**Replace file:** `apps/web/src/store/auth.store.ts`

This replaces the placeholder from Phase 1 with the complete implementation.

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@ecampus/types';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean; // True once Zustand has loaded from localStorage

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // ─── Initial State ──────────────────────────────────
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,

      // ─── Actions ────────────────────────────────────────

      /** Called on successful login or register */
      setAuth: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
        }),

      /** Called when the access token is refreshed (new token, same user) */
      setAccessToken: (token) =>
        set({ accessToken: token }),

      /** Called when user updates their profile */
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      /** Called on logout or 401 errors */
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),

      /** Called once Zustand has rehydrated from localStorage */
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'ecampus-auth-v1',
      storage: createJSONStorage(() => localStorage),
      // IMPORTANT: Do NOT persist accessToken to localStorage.
      // Access tokens are short-lived (15min). On page reload, the refresh
      // endpoint issues a new one via the httpOnly cookie.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // accessToken intentionally excluded
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

// ─── Selectors (use these in components for better re-render control) ─────────

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAccessToken = () => useAuthStore((s) => s.accessToken);
export const useIsHydrated = () => useAuthStore((s) => s.isHydrated);
```

---

## STEP 13 — UI Store and Notifications Store

**Create file:** `apps/web/src/store/ui.store.ts`

```typescript
import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number; // ms, default 4000
}

interface UIState {
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Modal
  activeModal: string | null;
  modalData: unknown;
  openModal: (name: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // ─── Toasts ─────────────────────────────────────────────
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = toast.duration ?? 4000;

    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  // ─── Modal ──────────────────────────────────────────────
  activeModal: null,
  modalData: null,
  openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));

// ─── Convenience helpers ──────────────────────────────────────────────────────

export function useToast() {
  const addToast = useUIStore((s) => s.addToast);

  return {
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
  };
}
```

**Create file:** `apps/web/src/store/notifications.store.ts`

```typescript
import { create } from 'zustand';

interface NotificationsState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  resetUnread: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  decrementUnread: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  resetUnread: () => set({ unreadCount: 0 }),
}));
```

---

## STEP 14 — Updated Axios API Client

**Replace file:** `apps/web/src/lib/api.ts`

Full implementation with proper token refresh logic wired to the Zustand store.

```typescript
import axios, { type AxiosError } from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send httpOnly cookies (refresh token) with every request
});

// ─── Request Interceptor ──────────────────────────────────────────────────────

api.interceptors.request.use((config) => {
  // Read token from Zustand store at request time
  // We do a direct store read (not a hook) since this is outside React
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('ecampus-auth-v1');
      const parsed = raw ? (JSON.parse(raw) as { state?: { accessToken?: string } }) : null;
      const token = parsed?.state?.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage unavailable or parse failed — continue without token
    }
  }
  return config;
});

// ─── Response Interceptor (Token Refresh) ─────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Only attempt refresh on 401 errors, not on the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post<{
          data: { accessToken: string };
        }>('/auth/refresh');

        const newToken = response.data.data.accessToken;

        // Update Zustand store with new token
        if (typeof window !== 'undefined') {
          // Dynamic import to avoid circular dependency at module load time
          const { useAuthStore } = await import('@/store/auth.store');
          useAuthStore.getState().setAccessToken(newToken);
        }

        processQueue(null, newToken);
        originalRequest.headers!.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh failed — clear auth and redirect to login
        if (typeof window !== 'undefined') {
          const { useAuthStore } = await import('@/store/auth.store');
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API Helpers ─────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post('/auth/refresh'),

  me: () => api.get('/auth/me'),
};

export default api;
```

---

## STEP 15 — useAuth Hook

**Create file:** `apps/web/src/hooks/useAuth.ts`

This is the single hook all components use for auth operations. Never call `authApi` directly from components — always use this hook.

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/store/ui.store';
import { authApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import type { User } from '@ecampus/types';

interface ApiAuthResponse {
  data: {
    data: {
      user: User;
      accessToken: string;
    };
  };
}

export function useAuth() {
  const router = useRouter();
  const toast = useToast();

  const { setAuth, clearAuth, updateUser, isAuthenticated, user, isHydrated } =
    useAuthStore();

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password }) as ApiAuthResponse;
    const { user: loggedInUser, accessToken } = response.data.data;
    setAuth(loggedInUser, accessToken);
    toast.success('Welcome back!', `Signed in as ${loggedInUser.name}`);
    router.push(ROUTES.HOME);
    router.refresh();
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authApi.register({ name, email, password }) as ApiAuthResponse;
    const { user: newUser, accessToken } = response.data.data;
    setAuth(newUser, accessToken);
    toast.success('Welcome to ECAMPUS Buzz!', 'Your account has been created.');
    router.push(ROUTES.HOME);
    router.refresh();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the API call fails, clear local state
    } finally {
      clearAuth();
      toast.info('Signed out', 'See you next time!');
      router.push(ROUTES.LOGIN);
      router.refresh();
    }
  };

  return {
    user,
    isAuthenticated,
    isHydrated,
    login,
    register,
    logout,
    updateUser,
  };
}
```

---

## STEP 16 — Design System UI Components

These are the reusable form components used on the auth pages.

### `apps/web/src/components/ui/Button.tsx`
```tsx
'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary:
    'bg-buzz-primary text-white hover:bg-buzz-primary-hover shadow-glow-primary hover:shadow-glow-primary active:scale-[0.97]',
  secondary:
    'bg-buzz-surface text-buzz-text border border-buzz-border hover:bg-buzz-muted/50 hover:border-buzz-muted',
  ghost:
    'text-buzz-text-muted hover:text-buzz-text hover:bg-buzz-surface/60',
  danger:
    'bg-buzz-danger/15 text-buzz-danger border border-buzz-danger/30 hover:bg-buzz-danger/25',
  outline:
    'border border-buzz-border text-buzz-text hover:border-buzz-primary/50 hover:text-buzz-primary hover:bg-buzz-primary/5',
};

const sizeStyles = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-buzz-primary focus-visible:ring-offset-2 focus-visible:ring-offset-buzz-black',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          // Variants
          variantStyles[variant],
          // Sizes
          sizeStyles[size],
          // Width
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading…</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
```

### `apps/web/src/components/ui/Input.tsx`
```tsx
'use client';

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, id, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-buzz-text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={inputType}
            className={cn(
              // Base
              'w-full rounded-xl px-4 py-2.5 text-sm',
              'bg-buzz-surface border',
              'text-buzz-text placeholder:text-buzz-text-subtle',
              'transition-all duration-200',
              // Focus
              'focus:outline-none focus:ring-2 focus:ring-buzz-primary/50 focus:border-buzz-primary/50',
              // Normal border
              !error && 'border-buzz-border hover:border-buzz-muted',
              // Error border
              error && 'border-buzz-danger/60 focus:ring-buzz-danger/40 focus:border-buzz-danger/60',
              // Password padding (room for eye icon)
              isPassword && 'pr-11',
              className
            )}
            {...props}
          />
          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-buzz-text-muted hover:text-buzz-text transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>
        {/* Error message */}
        {error && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-buzz-danger">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

---

## STEP 17 — Auth Pages (Full Implementation)

### Auth Layout — Replace: `apps/web/src/app/(auth)/layout.tsx`
```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | ECAMPUS Buzz',
    default: 'ECAMPUS Buzz',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-buzz-black overflow-hidden">

      {/* ── Ambient glow orbs — CSS-only, zero JS ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Top-left indigo orb */}
        <div
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }}
        />
        {/* Bottom-right cyan orb */}
        <div
          className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #22D3EE 0%, transparent 70%)' }}
        />
        {/* Center subtle glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 60%)' }}
        />
      </div>

      {/* ── Grid texture overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Dot grid accent ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ── Content ── */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Logo mark */}
        <a href="/" className="mb-8 flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-buzz-primary shadow-glow-primary group-hover:shadow-glow-accent transition-shadow duration-300">
            <span className="font-display text-lg font-bold text-white">B</span>
          </div>
          <span className="font-display text-xl font-bold text-buzz-text">
            ECAMPUS <span className="gradient-text">Buzz</span>
          </span>
        </a>

        {children}
      </main>
    </div>
  );
}
```

### Login Page — Replace: `apps/web/src/app/(auth)/login/page.tsx`
```tsx
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
  return <LoginForm />;
}
```

### Register Page — Replace: `apps/web/src/app/(auth)/register/page.tsx`
```tsx
import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = { title: 'Create Account' };

export default function RegisterPage() {
  return <RegisterForm />;
}
```

### Login Form Component — Create: `apps/web/src/components/auth/LoginForm.tsx`
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { loginSchema, type LoginFormData } from '@/lib/validators/auth.schema';
import { authFormVariants, authFieldVariants, staggerContainer, shakeVariants } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import type { AxiosError } from 'axios';

export function LoginForm() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setServerError(
        axiosErr.response?.data?.message ?? 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <motion.div
      variants={authFormVariants}
      initial="initial"
      animate="animate"
      className="w-full max-w-[420px]"
    >
      {/* Card */}
      <div className="glass rounded-modal p-8 shadow-card">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-buzz-text">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-buzz-text-muted">
            Sign in to your ECAMPUS Buzz account
          </p>
        </div>

        {/* Server Error */}
        <AnimatePresence mode="wait">
          {serverError && (
            <motion.div
              variants={shakeVariants}
              animate="shake"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-buzz-danger/30 bg-buzz-danger/10 px-4 py-3"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-buzz-danger" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <p className="text-sm text-buzz-danger">{serverError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <motion.div variants={authFieldVariants}>
            <Input
              {...register('email')}
              id="email"
              type="email"
              label="Email address"
              placeholder="you@university.edu"
              autoComplete="email"
              error={errors.email?.message}
              disabled={isSubmitting}
            />
          </motion.div>

          <motion.div variants={authFieldVariants}>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-sm font-medium text-buzz-text-muted">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-buzz-primary hover:text-buzz-accent transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              {...register('password')}
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              disabled={isSubmitting}
            />
          </motion.div>

          <motion.div variants={authFieldVariants} className="pt-1">
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </motion.div>
        </motion.form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-buzz-border" />
          <span className="text-xs text-buzz-text-subtle">or</span>
          <div className="h-px flex-1 bg-buzz-border" />
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-buzz-text-muted">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-buzz-primary hover:text-buzz-accent transition-colors underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Below card — subtle legal text */}
      <p className="mt-6 text-center text-xs text-buzz-text-subtle">
        By signing in you agree to our{' '}
        <a href="#" className="underline hover:text-buzz-text-muted transition-colors">Terms</a>
        {' '}and{' '}
        <a href="#" className="underline hover:text-buzz-text-muted transition-colors">Privacy Policy</a>
      </p>
    </motion.div>
  );
}
```

### Register Form Component — Create: `apps/web/src/components/auth/RegisterForm.tsx`
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { registerSchema, type RegisterFormData } from '@/lib/validators/auth.schema';
import { authFormVariants, authFieldVariants, staggerContainer, shakeVariants } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import type { AxiosError } from 'axios';

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Password strength indicator
  const password = watch('password', '');
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser(data.name, data.email, data.password);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setServerError(
        axiosErr.response?.data?.message ?? 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <motion.div
      variants={authFormVariants}
      initial="initial"
      animate="animate"
      className="w-full max-w-[440px]"
    >
      <div className="glass rounded-modal p-8 shadow-card">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-buzz-text">
            Join the Buzz
          </h1>
          <p className="mt-1.5 text-sm text-buzz-text-muted">
            Create your student account in seconds
          </p>
        </div>

        {/* Server Error */}
        <AnimatePresence mode="wait">
          {serverError && (
            <motion.div
              variants={shakeVariants}
              animate="shake"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-buzz-danger/30 bg-buzz-danger/10 px-4 py-3"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-buzz-danger" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <p className="text-sm text-buzz-danger">{serverError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <motion.div variants={authFieldVariants}>
            <Input
              {...register('name')}
              id="name"
              type="text"
              label="Full name"
              placeholder="Your name"
              autoComplete="name"
              error={errors.name?.message}
              disabled={isSubmitting}
            />
          </motion.div>

          <motion.div variants={authFieldVariants}>
            <Input
              {...register('email')}
              id="email"
              type="email"
              label="Email address"
              placeholder="you@university.edu"
              autoComplete="email"
              error={errors.email?.message}
              disabled={isSubmitting}
            />
          </motion.div>

          <motion.div variants={authFieldVariants}>
            <Input
              {...register('password')}
              id="password"
              type="password"
              label="Password"
              placeholder="Min 8 chars, with uppercase & number"
              autoComplete="new-password"
              error={errors.password?.message}
              disabled={isSubmitting}
            />
            {/* Password strength bar */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <motion.div
                      key={level}
                      className="h-1 flex-1 rounded-full"
                      style={{
                        backgroundColor:
                          passwordStrength >= level
                            ? level <= 1
                              ? '#F43F5E'
                              : level <= 2
                              ? '#F59E0B'
                              : level <= 3
                              ? '#6366F1'
                              : '#10B981'
                            : '#1C2333',
                      }}
                      animate={{ opacity: 1 }}
                      initial={{ opacity: 0 }}
                    />
                  ))}
                </div>
                <p className="text-xs text-buzz-text-subtle">
                  {['', 'Weak', 'Fair', 'Strong', 'Very strong'][passwordStrength]}
                </p>
              </div>
            )}
          </motion.div>

          <motion.div variants={authFieldVariants}>
            <Input
              {...register('confirmPassword')}
              id="confirmPassword"
              type="password"
              label="Confirm password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              disabled={isSubmitting}
            />
          </motion.div>

          <motion.div variants={authFieldVariants} className="pt-1">
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </motion.div>
        </motion.form>

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm text-buzz-text-muted">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-buzz-primary hover:text-buzz-accent transition-colors underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-buzz-text-subtle">
        By creating an account you agree to our{' '}
        <a href="#" className="underline hover:text-buzz-text-muted transition-colors">Terms</a>
        {' '}and{' '}
        <a href="#" className="underline hover:text-buzz-text-muted transition-colors">Privacy Policy</a>
      </p>
    </motion.div>
  );
}

// ─── Password Strength Util ───────────────────────────────────────────────────

function getPasswordStrength(password: string): number {
  if (password.length === 0) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}
```

---

## ═══════════════════════════════════════════
## WIRING: ROUTE PROTECTION & APP SHELL (Steps 18–20)
## ═══════════════════════════════════════════

---

## STEP 18 — Next.js Middleware (Route Protection)

**Create file:** `apps/web/src/middleware.ts`

⚠️ This file must be at `src/middleware.ts` (not inside `app/`). Next.js automatically picks it up.

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

// Routes only for super admins (client-enforced; also enforced server-side)
// The real enforcement is in the API's RBAC middleware

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets and API routes through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie — the httpOnly refresh token tells us if a session exists
  // NOTE: We can't read the accessToken (it's only in Zustand/memory)
  // So we check for the refresh token cookie as the session indicator
  const refreshToken = request.cookies.get('ecampus_refresh_token');
  const isAuthenticated = Boolean(refreshToken);

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isRootPath = pathname === '/';

  // Redirect root to home or login
  if (isRootPath) {
    return NextResponse.redirect(
      new URL(isAuthenticated ? '/home' : '/login', request.url)
    );
  }

  // Unauthenticated user trying to access a protected route → login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // Preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access auth pages → home
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## STEP 19 — Protected App Layout with Auth Guard

**Modify file:** `apps/web/src/app/(app)/layout.tsx`

Replace with this version that verifies auth state client-side and shows a loading state during hydration.

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useIsAuthenticated, useIsHydrated } from '@/store/auth.store';
import { ROUTES } from '@/lib/constants';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  const isHydrated = useIsHydrated();

  useEffect(() => {
    // Only check after Zustand has rehydrated from localStorage
    // (prevents flash of login redirect on page refresh)
    if (isHydrated && !isAuthenticated) {
      router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, isAuthenticated, router, pathname]);

  // Show loading spinner while Zustand rehydrates
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-buzz-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 animate-pulse rounded-full bg-buzz-primary/20" />
            <div className="absolute inset-0 animate-ping rounded-full bg-buzz-primary/10" />
          </div>
          <p className="font-display text-xs tracking-widest text-buzz-text-subtle uppercase">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  // Don't render protected content until we've confirmed auth
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-buzz-black">
      <Navbar />
      <main className="pb-20 pt-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
```

---

## STEP 20 — Update Navbar with Live Auth State

**Modify file:** `apps/web/src/components/layout/Navbar.tsx`

Replace with this version that shows real user data from the auth store and a functional logout button.

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/utils';
import { fadeInDown } from '@/lib/motion';

const navLinks = [
  { href: '/home', label: 'Feed' },
  { href: '/clubs', label: 'Clubs' },
  { href: '/events', label: 'Events' },
  { href: '/polls', label: 'Polls' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <motion.header
      variants={fadeInDown}
      initial="initial"
      animate="animate"
      className="glass-heavy fixed top-0 left-0 right-0 z-50 h-16 border-b border-buzz-border/50"
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-buzz-primary shadow-glow-primary group-hover:shadow-glow-accent transition-shadow duration-300">
            <span className="font-display text-sm font-bold text-white">B</span>
          </div>
          <span className="font-display text-lg font-bold text-buzz-text hidden sm:block">
            ECAMPUS <span className="gradient-text">Buzz</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-buzz-primary'
                    : 'text-buzz-text-muted hover:bg-buzz-surface hover:text-buzz-text'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-buzz-primary/12"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              {/* Notifications Bell */}
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-buzz-text-muted transition-colors hover:bg-buzz-surface hover:text-buzz-text"
                aria-label="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {/* Unread badge — wired in Phase 4 */}
              </Link>

              {/* User dropdown (simple for now) */}
              <div className="relative group">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-buzz-primary/20 text-xs font-bold text-buzz-primary ring-2 ring-transparent hover:ring-buzz-primary/40 transition-all duration-200"
                  aria-label="User menu"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </button>

                {/* Dropdown menu */}
                <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                  <div className="glass-heavy rounded-xl border border-buzz-border/50 p-1 shadow-card">
                    <div className="px-3 py-2 border-b border-buzz-border/50 mb-1">
                      <p className="text-sm font-medium text-buzz-text truncate">{user.name}</p>
                      <p className="text-xs text-buzz-text-muted truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-buzz-text-muted hover:text-buzz-text hover:bg-buzz-surface/60 transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/saved"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-buzz-text-muted hover:text-buzz-text hover:bg-buzz-surface/60 transition-colors"
                    >
                      Saved
                    </Link>
                    <button
                      onClick={() => void logout()}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-buzz-danger hover:bg-buzz-danger/10 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-pill bg-buzz-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-buzz-primary-hover transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
```

---

## FINAL VERIFICATION

### Test the complete auth flow:

```bash
# 1. Start everything from root
npm run dev

# 2. Open http://localhost:3000
# Should redirect to /login (middleware)

# 3. Register a new account
# Fill form → should redirect to /home

# 4. Refresh the page
# Should STAY on /home (Zustand rehydration works)

# 5. Navigate to /login while logged in
# Should redirect back to /home (middleware)

# 6. Click Sign out in the navbar
# Should redirect to /login

# 7. Try accessing /home manually while logged out
# Should redirect to /login?redirect=/home

# 8. Test API directly
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Student One","email":"student@test.com","password":"Password123"}'

curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"student@test.com","password":"Password123"}'

# Test /me with token from login response
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer PASTE_ACCESS_TOKEN_HERE"

# Test refresh (using cookie)
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -b cookies.txt

# Verify rate limiting (run 21 times)
for i in {1..21}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"wrong"}'
done
# Last response should be 429 Too Many Requests
```

### Type-check everything:
```bash
npm run type-check
```

---

## PHASE 2 COMPLETION SUMMARY

| ✅ | What was built |
|---|---|
| `auth.schema.ts` | Zod validation for register + login |
| `auth.repository.ts` | Prisma layer — findByEmail, create, findById |
| `auth.service.ts` | Business logic — register, login, refresh, getMe |
| `auth.controller.ts` | HTTP handlers + httpOnly cookie strategy |
| `auth.router.ts` | Routes with per-endpoint rate limiting |
| `auth.middleware.ts` | Full JWT verification + optionalAuth |
| `motion.ts` | Centralized Framer Motion variant library |
| `auth.schema.ts` (web) | Client-side Zod mirrors |
| `auth.store.ts` | Full Zustand auth store with persistence |
| `ui.store.ts` | Toast system + modal state |
| `notifications.store.ts` | Unread count store |
| `api.ts` | Axios with token refresh queue logic |
| `useAuth.ts` | Single auth hook for all components |
| `Button.tsx` | Full design system Button with variants |
| `Input.tsx` | Full Input with error states + password toggle |
| `LoginForm.tsx` | Animated form with server error handling |
| `RegisterForm.tsx` | Animated form with password strength indicator |
| `(auth)/layout.tsx` | Futuristic auth layout with ambient glows |
| `middleware.ts` | Next.js edge middleware for route protection |
| `(app)/layout.tsx` | Auth-guarded app shell with hydration safety |
| `Navbar.tsx` | Live user state, logout, animated nav indicator |

## WHAT COMES NEXT (Phase 3 — Clubs Module)

- `clubs.schema.ts` — Zod for createClub, updateClub
- `clubs.repository.ts` — Prisma queries for clubs + memberships
- `clubs.service.ts` — join/request/approve/reject logic
- `/clubs` directory page with search + animated grid
- `/clubs/[slug]` club page with feed tabs
- `JoinButton` state machine component
- `ClubCard` with glassmorphism + hover glow
- `CreateClubModal` with image upload

---

*ECAMPUS Buzz — Phase 2 Auth System Complete*
*Follow steps 1–20 in exact order. Do not skip ahead.*
