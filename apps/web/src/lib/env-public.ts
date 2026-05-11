/**
 * Browser-visible API origin. Defaults to local API in development when unset.
 */
export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080";
  }
  throw new Error("NEXT_PUBLIC_API_URL is required in production");
}
