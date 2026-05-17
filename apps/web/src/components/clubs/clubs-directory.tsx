"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ClubCard } from "@/components/clubs/club-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { AuthApiError, fetchClubsList } from "@/lib/clubs-api";
import type { ClubSummary } from "@/lib/clubs-types";

export function ClubsDirectory() {
  const { accessToken } = useAuth();
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClubsList(accessToken, { page, limit: 20, q: q || undefined });
      setClubs(data.clubs);
      setTotalPages(data.pagination.totalPages);
    } catch (e) {
      setError(e instanceof AuthApiError ? e.message : "Failed to load clubs.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQ(searchInput.trim());
  };

  return (
    <main className="buzz-shell py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
            Discover
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
            Campus clubs
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
            Join public communities instantly, or request access to private clubs.
          </p>
        </div>
        <Link href="/clubs/new">
          <Button size="lg">Create club</Button>
        </Link>
      </div>

      <form onSubmit={onSearch} className="mb-8 flex gap-2">
        <Input
          placeholder="Search clubs, tags…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {error ? (
        <p
          role="alert"
          className="mb-6 rounded-[var(--radius-card)] border border-[hsl(var(--destructive)/0.45)] bg-[hsl(var(--destructive)/0.12)] px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="buzz-glass h-48 animate-pulse" />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <Card className="buzz-glass shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-3 py-12 text-center">
            <p className="text-lg font-medium text-[hsl(var(--foreground))]">No clubs found</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Be the first to start a community on campus.
            </p>
            <Link href="/clubs/new">
              <Button>Create a club</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-[hsl(var(--muted-foreground))]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
