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
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const clearAuth = useCallback(() => {
    clearAccessToken();
    setAccessToken(null);
    setUserState(null);
    setStatus("unauthenticated");
  }, []);

  const setAuthFromPayload = useCallback((payload: AuthSuccessPayload) => {
    persistAccessToken(payload.accessToken);
    setAccessToken(payload.accessToken);
    setUserState(payload.user);
    setStatus("authenticated");
  }, []);

  const updateUser = useCallback((next: AuthUser) => {
    setUserState(next);
  }, []);

  const hydrateAuth = useCallback(async () => {
    setStatus("loading");
    const storedToken = readAccessToken();

    if (storedToken) {
      try {
        const me = await fetchCurrentUser(storedToken);
        setAccessToken(storedToken);
        setUserState(me.user);
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
      setUserState(me.user);
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
      updateUser,
      clearAuth,
      rehydrateAuth: hydrateAuth
    }),
    [accessToken, clearAuth, hydrateAuth, setAuthFromPayload, status, updateUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
