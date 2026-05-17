"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  AuthApiError,
  fetchClubBySlug,
  fetchClubMembersApi,
  joinClubApi,
  leaveClubApi,
  requestJoinClubApi,
  updateMemberApi
} from "@/lib/clubs-api";
import type { ClubSummary, ViewerMembership } from "@/lib/clubs-types";

export function ClubDetailClient({ slug }: { slug: string }) {
  const { accessToken, user, status: authStatus } = useAuth();
  const [club, setClub] = useState<ClubSummary | null>(null);
  const [members, setMembers] = useState<ViewerMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await fetchClubBySlug(accessToken, slug);
      setClub(c);
      if (accessToken && c.viewerMembership?.status === "APPROVED" && c.viewerMembership.role === "ADMIN") {
        const { members: m } = await fetchClubMembersApi(accessToken, c.id);
        setMembers(m);
      } else {
        setMembers([]);
      }
    } catch (e) {
      setError(e instanceof AuthApiError ? e.message : "Failed to load club.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, slug]);

  useEffect(() => {
    if (authStatus === "loading") return;
    void load();
  }, [authStatus, load]);

  const isAdmin =
    club?.viewerMembership?.status === "APPROVED" && club.viewerMembership.role === "ADMIN";
  const isMember = club?.viewerMembership?.status === "APPROVED";
  const isPending = club?.viewerMembership?.status === "PENDING";

  const runAction = async (fn: () => Promise<void>) => {
    if (!accessToken) return;
    setActionLoading(true);
    setMessage(null);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof AuthApiError ? e.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = () =>
    runAction(async () => {
      if (!club || !accessToken) return;
      if (club.visibility === "PUBLIC") {
        await joinClubApi(accessToken, club.id);
        setMessage("You joined this club.");
      } else {
        await requestJoinClubApi(accessToken, club.id);
        setMessage("Join request sent.");
      }
    });

  const handleLeave = () =>
    runAction(async () => {
      if (!club || !accessToken) return;
      await leaveClubApi(accessToken, club.id);
      setMessage("You left this club.");
    });

  const approveMember = (userId: string) =>
    runAction(async () => {
      if (!club || !accessToken) return;
      await updateMemberApi(accessToken, club.id, userId, { status: "APPROVED" });
      setMessage("Member approved.");
    });

  const rejectMember = (userId: string) =>
    runAction(async () => {
      if (!club || !accessToken) return;
      await updateMemberApi(accessToken, club.id, userId, { status: "REJECTED" });
      setMessage("Request rejected.");
    });

  if (loading || authStatus === "loading") {
    return (
      <main className="buzz-shell py-10 sm:py-14">
        <Card className="buzz-glass h-64 animate-pulse shadow-[var(--shadow-soft)]" />
      </main>
    );
  }

  if (error && !club) {
    return (
      <main className="buzz-shell py-10 sm:py-14">
        <p role="alert" className="text-[hsl(var(--destructive))]">
          {error}
        </p>
        <Link href="/clubs" className="mt-4 inline-block text-[hsl(var(--primary))] hover:underline">
          ← Back to clubs
        </Link>
      </main>
    );
  }

  if (!club) return null;

  return (
    <main className="buzz-shell py-10 sm:py-14">
      <Link
        href="/clubs"
        className="mb-6 inline-flex text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline"
      >
        ← All clubs
      </Link>

      <Card className="overflow-hidden border-white/10 bg-[hsl(var(--card)/0.88)] shadow-[var(--shadow-soft)]">
        <div className="relative h-40 bg-gradient-to-br from-[hsl(var(--primary)/0.3)] to-[hsl(var(--accent)/0.15)] sm:h-52">
          {club.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.coverImage} alt="" className="h-full w-full object-cover opacity-70" />
          ) : null}
        </div>
        <CardContent className="relative space-y-6 p-6 sm:p-8">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[var(--radius-card)] border-4 border-[hsl(var(--card))] bg-[hsl(var(--secondary))] text-2xl font-bold">
                {club.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={club.logo} alt="" className="h-full w-full rounded-[var(--radius-card)] object-cover" />
                ) : (
                  club.name.charAt(0)
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))] sm:text-3xl">
                  {club.name}
                </h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  @{club.slug} · {club.memberCount} members · {club.visibility.toLowerCase()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!accessToken ? (
                <Link href="/login">
                  <Button>Sign in to join</Button>
                </Link>
              ) : isMember ? (
                <Button variant="secondary" disabled={actionLoading} onClick={() => void handleLeave()}>
                  Leave club
                </Button>
              ) : isPending ? (
                <Button variant="secondary" disabled>
                  Request pending
                </Button>
              ) : (
                <Button disabled={actionLoading} onClick={() => void handleJoin()}>
                  {club.visibility === "PUBLIC" ? "Join club" : "Request to join"}
                </Button>
              )}
            </div>
          </div>

          {(message || error) && (
            <div aria-live="polite">
              {message ? (
                <p className="rounded-[var(--radius-card)] border border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.12)] px-3 py-2 text-sm">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="mt-2 rounded-[var(--radius-card)] border border-[hsl(var(--destructive)/0.45)] bg-[hsl(var(--destructive)/0.12)] px-3 py-2 text-sm">
                  {error}
                </p>
              ) : null}
            </div>
          )}

          {club.description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-base">
              {club.description}
            </p>
          ) : null}

          {club.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {club.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[var(--radius-pill)] bg-white/5 px-3 py-1 text-xs text-[hsl(var(--muted-foreground))]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {isMember ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Club feed, posts, and events will appear here in a future release.
            </p>
          ) : club.visibility === "PRIVATE" && !isPending ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              This is a private club. Request access to see member-only content.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {isAdmin && members.length > 0 ? (
        <Card className="mt-8 buzz-glass shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Members</h2>
            <ul className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-[hsl(var(--foreground))]">
                      {m.user.displayName ?? m.user.name}
                      {m.user.username ? (
                        <span className="ml-2 text-sm text-[hsl(var(--muted-foreground))]">
                          @{m.user.username}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {m.role} · {m.status}
                    </p>
                  </div>
                  {m.status === "PENDING" && m.userId !== user?.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => void approveMember(m.userId)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={actionLoading}
                        onClick={() => void rejectMember(m.userId)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
