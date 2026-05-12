"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function RequireOnboardingComplete({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && user && !user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [router, status, user]);

  if (status === "loading") {
    return (
      <main className="buzz-shell flex min-h-[70dvh] items-center py-10 sm:py-14">
        <Card className="buzz-glass w-full max-w-xl shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-white/15" />
            <div className="h-3 w-72 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-56 animate-pulse rounded bg-white/10" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (status === "authenticated" && user && !user.onboardingCompleted) {
    return null;
  }

  return <>{children}</>;
}
