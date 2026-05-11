/** Session-scoped access token for subsequent API calls (refresh cookie is httpOnly on API origin). */
export const ACCESS_TOKEN_STORAGE_KEY = "ecampus_access_token";

export function persistAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } catch {
    // storage may be unavailable; ignore
  }
}

export function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    // storage may be unavailable; ignore
  }
}
