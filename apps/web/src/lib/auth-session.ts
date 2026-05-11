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
