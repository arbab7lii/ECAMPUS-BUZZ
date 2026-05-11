import { AuthGuard } from "@/components/auth/auth-guard";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <AuthGuard>
      <main className="buzz-shell py-10 sm:py-14">
        <Card className="buzz-glass shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-3">
            <h1 className="text-balance text-3xl font-semibold text-[hsl(var(--foreground))] sm:text-4xl">
              Home Feed
            </h1>
            <p className="max-w-2xl text-sm sm:text-base">
              You are authenticated. Product modules will be added in upcoming steps.
            </p>
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}
