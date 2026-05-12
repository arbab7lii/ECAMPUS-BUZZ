"use client";

import { createContext, useContext } from "react";

import type { AuthSuccessPayload, AuthUser } from "@/lib/auth-client";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  setAuthFromPayload: (payload: AuthSuccessPayload) => void;
  updateUser: (user: AuthUser) => void;
  clearAuth: () => void;
  rehydrateAuth: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
