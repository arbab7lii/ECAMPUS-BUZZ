import { getPublicApiBaseUrl } from "@/lib/env-public";

const AUTH_PREFIX = "/api/v1/auth";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  displayName: string | null;
  username: string | null;
  college: string | null;
  branch: string | null;
  graduationYear: number | null;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSuccessPayload = {
  user: AuthUser;
  accessToken: string;
};

type AuthMePayload = {
  user: AuthUser;
};

type AuthRefreshPayload = {
  accessToken: string;
};

export class AuthApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

function authUrl(path: string): string {
  return `${getPublicApiBaseUrl()}${AUTH_PREFIX}${path}`;
}

function extractMessage(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "Something went wrong. Please try again.";
  }
  const b = body as Record<string, unknown>;
  if (typeof b.message === "string" && b.message.length > 0) {
    return b.message;
  }
  const err = b.error;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return "Something went wrong. Please try again.";
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  const json = await parseJson(res);
  if (!res.ok) {
    throw new AuthApiError(res.status, extractMessage(json));
  }

  const envelope = json as Record<string, unknown> | null;
  if (!envelope || envelope.success !== true || !envelope.data) {
    throw new AuthApiError(res.status, "Unexpected response from server.");
  }

  return envelope.data as T;
}

/** Authenticated JSON request to `/api/v1/*` (Bearer + cookies). */
export async function apiV1Json<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${getPublicApiBaseUrl()}/api/v1${path}`, {
    ...init,
    headers,
    credentials: "include"
  });

  return parseEnvelope<T>(res);
}

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(authUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include"
  });

  return parseEnvelope<T>(res);
}

export async function registerRequest(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSuccessPayload> {
  return postAuth<AuthSuccessPayload>("/register", input);
}

export async function loginRequest(input: {
  email: string;
  password: string;
}): Promise<AuthSuccessPayload> {
  return postAuth<AuthSuccessPayload>("/login", input);
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthMePayload> {
  const res = await fetch(authUrl("/me"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    credentials: "include"
  });
  return parseEnvelope<AuthMePayload>(res);
}

export async function refreshAccessToken(): Promise<AuthRefreshPayload> {
  return postAuth<AuthRefreshPayload>("/refresh", {});
}
