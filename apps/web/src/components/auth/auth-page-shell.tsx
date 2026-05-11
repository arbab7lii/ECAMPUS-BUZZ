"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { authFormReveal } from "@/lib/motion";

type AuthPageShellProps = {
  title: string;
  subtitle?: string;
  alternateHref: string;
  alternateLabel: string;
  children: React.ReactNode;
};

export function AuthPageShell({
  title,
  subtitle,
  alternateHref,
  alternateLabel,
  children
}: AuthPageShellProps) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col justify-center px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-[hsl(var(--primary)/0.12)] blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-[hsl(var(--accent)/0.1)] blur-3xl" />
      </div>

      <motion.div
        className="relative z-[1] mx-auto w-full max-w-md"
        initial={authFormReveal.initial}
        animate={authFormReveal.animate}
        transition={authFormReveal.transition}
      >
        <Link
          href="/"
          className="mb-4 inline-flex text-sm font-medium text-[hsl(var(--muted-foreground))] underline-offset-4 transition-colors hover:text-[hsl(var(--foreground))] hover:underline"
        >
          ← Back to home
        </Link>

        <Card className="overflow-hidden border-white/10 bg-[hsl(var(--card)/0.88)] shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--primary)/0.15)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <header className="space-y-2 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                ECAMPUS Buzz
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
              ) : null}
            </header>

            {children}

            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              <Link
                href={alternateHref}
                className="font-medium text-[hsl(var(--primary))] underline-offset-4 hover:underline"
              >
                {alternateLabel}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
