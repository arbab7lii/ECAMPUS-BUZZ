"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function AuthGuard({
  children,
  redirectTo = "/login"
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(redirectTo);
    }
  }, [redirectTo, router, status]);

  if (status === "loading") {
    return (
      <main className="buzz-shell flex min-h-[70dvh] items-center py-10 sm:py-14">
        <Card className="buzz-glass w-full max-w-xl shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-white/15" />
            <div className="h-3 w-64 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-52 animate-pulse rounded bg-white/10" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
