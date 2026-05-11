"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AuthApiError,
  type AuthSuccessPayload,
  type AuthUser,
  fetchCurrentUser,
  refreshAccessToken
} from "@/lib/auth-client";
import {
  clearAccessToken,
  persistAccessToken,
  readAccessToken
} from "@/lib/auth-session";
import { AuthContext } from "@/hooks/use-auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

function isUnauthorized(error: unknown): boolean {
  return error instanceof AuthApiError && error.status === 401;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const clearAuth = useCallback(() => {
    clearAccessToken();
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const setAuthFromPayload = useCallback((payload: AuthSuccessPayload) => {
    persistAccessToken(payload.accessToken);
    setAccessToken(payload.accessToken);
    setUser(payload.user);
    setStatus("authenticated");
  }, []);

  const hydrateAuth = useCallback(async () => {
    setStatus("loading");
    const storedToken = readAccessToken();

    if (storedToken) {
      try {
        const me = await fetchCurrentUser(storedToken);
        setAccessToken(storedToken);
        setUser(me.user);
        setStatus("authenticated");
        return;
      } catch (error) {
        if (!isUnauthorized(error)) {
          clearAuth();
          return;
        }
      }
    }

    try {
      const { accessToken: freshToken } = await refreshAccessToken();
      const me = await fetchCurrentUser(freshToken);
      persistAccessToken(freshToken);
      setAccessToken(freshToken);
      setUser(me.user);
      setStatus("authenticated");
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      status,
      isAuthenticated: status === "authenticated",
      setAuthFromPayload,
      clearAuth,
      rehydrateAuth: hydrateAuth
    }),
    [accessToken, clearAuth, hydrateAuth, setAuthFromPayload, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
