import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import type { ClubSummary } from "@/lib/clubs-types";

function membershipLabel(club: ClubSummary): string | null {
  const m = club.viewerMembership;
  if (!m) return null;
  if (m.status === "APPROVED") return m.role === "ADMIN" ? "Admin" : "Member";
  if (m.status === "PENDING") return "Requested";
  if (m.status === "REJECTED") return "Rejected";
  return null;
}

export function ClubCard({ club }: { club: ClubSummary }) {
  const badge = membershipLabel(club);

  return (
    <Link href={`/clubs/${club.slug}`} className="group block">
      <Card className="h-full overflow-hidden border-white/10 bg-[hsl(var(--card)/0.88)] shadow-[var(--shadow-soft)] transition-all duration-200 group-hover:border-[hsl(var(--primary)/0.35)] group-hover:shadow-[var(--shadow-glow)]">
        <div className="relative h-28 bg-gradient-to-br from-[hsl(var(--primary)/0.25)] to-[hsl(var(--accent)/0.12)]">
          {club.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.coverImage} alt="" className="h-full w-full object-cover opacity-80" />
          ) : null}
          <div className="absolute bottom-3 left-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] border border-white/15 bg-[hsl(var(--secondary))] text-lg font-semibold text-[hsl(var(--foreground))]">
            {club.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={club.logo} alt="" className="h-full w-full rounded-[var(--radius-card)] object-cover" />
            ) : (
              club.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]">
              {club.name}
            </h2>
            <span
              className={`shrink-0 rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                club.visibility === "PUBLIC"
                  ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              }`}
            >
              {club.visibility === "PUBLIC" ? "Public" : "Private"}
            </span>
          </div>
          {club.description ? (
            <p className="line-clamp-2 text-sm text-[hsl(var(--muted-foreground))]">{club.description}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span>{club.memberCount} members</span>
            {badge ? (
              <span className="rounded-[var(--radius-pill)] border border-white/10 bg-white/5 px-2 py-0.5">
                {badge}
              </span>
            ) : null}
          </div>
          {club.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {club.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-[var(--radius-pill)] bg-white/5 px-2 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
