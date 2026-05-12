import { apiV1Json, type AuthUser } from "@/lib/auth-client";

export async function fetchProfileApi(accessToken: string) {
  return apiV1Json<{ profile: AuthUser }>(accessToken, "/profile", { method: "GET" });
}

export async function patchProfileApi(accessToken: string, body: Record<string, unknown>) {
  return apiV1Json<{ profile: AuthUser }>(accessToken, "/profile", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export async function completeOnboardingApi(accessToken: string, body: Record<string, unknown>) {
  return apiV1Json<{ profile: AuthUser }>(accessToken, "/profile/onboarding", {
    method: "POST",
    body: JSON.stringify(body)
  });
}
