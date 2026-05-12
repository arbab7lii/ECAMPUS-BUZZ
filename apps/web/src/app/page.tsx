import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="buzz-shell py-10 sm:py-14">
      <Card className="buzz-glass shadow-[var(--shadow-soft)]">
        <CardContent className="space-y-3">
          <h1 className="text-balance text-3xl font-semibold text-[hsl(var(--foreground))] sm:text-4xl">
            ECAMPUS Buzz
          </h1>
          <p className="max-w-2xl text-sm sm:text-base">
            Design-system and infrastructure foundation is ready for the
            futuristic mobile-first product build.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
            <Link
              href="/login"
              className="text-[hsl(var(--primary))] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-[hsl(var(--accent))] underline-offset-4 hover:underline"
            >
              Create account
            </Link>
            <Link
              href="/profile"
              className="text-[hsl(var(--foreground))] underline-offset-4 hover:underline"
            >
              Profile
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
