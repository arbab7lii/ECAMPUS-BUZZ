import { getPublicApiBaseUrl } from "@/lib/env-public";
import { apiV1Json, AuthApiError } from "@/lib/auth-client";
import type { ClubSummary, ClubsListResponse, ViewerMembership } from "@/lib/clubs-types";

export { AuthApiError };

export async function fetchClubsList(
  accessToken: string | null,
  params: { page?: number; limit?: number; q?: string }
): Promise<ClubsListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  const qs = search.toString();

  const headers: HeadersInit = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${getPublicApiBaseUrl()}/api/v1/clubs${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers,
    credentials: "include"
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const message =
      json && typeof json === "object" && "error" in json
        ? String((json as { error?: { message?: string } }).error?.message ?? "Request failed")
        : "Request failed";
    throw new AuthApiError(res.status, message);
  }

  const envelope = json as { success: boolean; data: ClubsListResponse };
  return envelope.data;
}

export async function fetchClubBySlug(accessToken: string | null, slug: string) {
  const headers: HeadersInit = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${getPublicApiBaseUrl()}/api/v1/clubs/${encodeURIComponent(slug)}`, {
    method: "GET",
    headers,
    credentials: "include"
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const message =
      json && typeof json === "object" && "error" in json
        ? String((json as { error?: { message?: string } }).error?.message ?? "Request failed")
        : "Request failed";
    throw new AuthApiError(res.status, message);
  }

  const envelope = json as { success: boolean; data: { club: ClubSummary } };
  return envelope.data.club;
}

export async function createClubApi(accessToken: string, body: Record<string, unknown>) {
  return apiV1Json<{ club: ClubSummary }>(accessToken, "/clubs", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function joinClubApi(accessToken: string, clubId: string) {
  return apiV1Json<{ membership: ViewerMembership }>(accessToken, `/clubs/${clubId}/join`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function requestJoinClubApi(accessToken: string, clubId: string) {
  return apiV1Json<{ membership: ViewerMembership }>(accessToken, `/clubs/${clubId}/request`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function leaveClubApi(accessToken: string, clubId: string) {
  return apiV1Json<null>(accessToken, `/clubs/${clubId}/leave`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function fetchClubMembersApi(accessToken: string, clubId: string) {
  return apiV1Json<{ members: ViewerMembership[] }>(accessToken, `/clubs/${clubId}/members`, {
    method: "GET"
  });
}

export async function updateMemberApi(
  accessToken: string,
  clubId: string,
  userId: string,
  body: { role?: string; status?: string }
) {
  return apiV1Json<{ membership: ViewerMembership }>(
    accessToken,
    `/clubs/${clubId}/members/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body)
    }
  );
}
