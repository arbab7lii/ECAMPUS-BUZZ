"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function RequireOnboardingPending({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && user?.onboardingCompleted) {
      router.replace("/home");
    }
  }, [router, status, user]);

  if (status === "loading") {
    return (
      <main className="relative flex min-h-[100dvh] flex-col justify-center px-4 py-10 sm:px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-[hsl(var(--primary)/0.12)] blur-3xl" />
          <div className="absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-[hsl(var(--accent)/0.1)] blur-3xl" />
        </div>
        <Card className="relative z-[1] mx-auto w-full max-w-lg buzz-glass shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-6 sm:p-8">
            <div className="h-5 w-48 animate-pulse rounded bg-white/15" />
            <div className="h-12 w-full animate-pulse rounded bg-white/10" />
            <div className="h-12 w-full animate-pulse rounded bg-white/10" />
            <div className="h-12 w-full animate-pulse rounded bg-white/10" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (status === "authenticated" && user?.onboardingCompleted) {
    return null;
  }

  return <>{children}</>;
}
