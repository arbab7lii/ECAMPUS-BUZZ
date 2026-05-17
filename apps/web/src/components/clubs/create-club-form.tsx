"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { AuthApiError, createClubApi } from "@/lib/clubs-api";
import { createClubFormSchema, type CreateClubFormValues } from "@/lib/clubs-form-schemas";
import { cn } from "@/lib/utils";

const selectClass =
  "flex h-12 w-full appearance-none rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 text-sm text-[hsl(var(--foreground))] shadow-inner shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]";

export function CreateClubForm() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateClubFormValues>({
    resolver: zodResolver(createClubFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      tags: "",
      visibility: "PUBLIC",
      logo: "",
      coverImage: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!accessToken) return;
    setApiError(null);
    setSuccess(false);
    try {
      const tags = values.tags
        ? values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const body: Record<string, unknown> = {
        name: values.name,
        description: values.description?.trim() || undefined,
        tags,
        visibility: values.visibility
      };
      if (values.slug?.trim()) body.slug = values.slug.trim();
      if (values.logo?.trim()) body.logo = values.logo.trim();
      if (values.coverImage?.trim()) body.coverImage = values.coverImage.trim();

      const { club } = await createClubApi(accessToken, body);
      setSuccess(true);
      window.setTimeout(() => router.push(`/clubs/${club.slug}`), 800);
    } catch (e) {
      setApiError(e instanceof AuthApiError ? e.message : "Failed to create club.");
    }
  });

  return (
    <main className="buzz-shell py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <Link
          href="/clubs"
          className="mb-4 inline-flex text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline"
        >
          ← Back to clubs
        </Link>

        <Card className="buzz-glass shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--primary)/0.12)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <header>
              <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))] sm:text-3xl">
                Create a club
              </h1>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                You&apos;ll be the club admin. Posts and feeds come in a later step.
              </p>
            </header>

            <div aria-live="polite" className="min-h-[1.25rem] space-y-2">
              {apiError ? (
                <p role="alert" className="rounded-[var(--radius-card)] border border-[hsl(var(--destructive)/0.45)] bg-[hsl(var(--destructive)/0.12)] px-3 py-2 text-sm">
                  {apiError}
                </p>
              ) : null}
              {success ? (
                <p className="rounded-[var(--radius-card)] border border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.12)] px-3 py-2 text-sm">
                  Club created. Opening…
                </p>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="club-name">Club name</Label>
                <Input id="club-name" {...register("name")} />
                {errors.name ? (
                  <p className="text-sm text-[hsl(var(--destructive))]">{errors.name.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="club-slug">Custom slug (optional)</Label>
                <Input id="club-slug" placeholder="e.g. robotics-society" {...register("slug")} />
                {errors.slug ? (
                  <p className="text-sm text-[hsl(var(--destructive))]">{errors.slug.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="club-vis">Visibility</Label>
                <select id="club-vis" className={cn(selectClass)} {...register("visibility")}>
                  <option value="PUBLIC">Public — anyone can join</option>
                  <option value="PRIVATE">Private — join requests need approval</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="club-desc">Description</Label>
                <Textarea id="club-desc" rows={4} {...register("description")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="club-tags">Tags (comma-separated)</Label>
                <Input id="club-tags" placeholder="tech, design, events" {...register("tags")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="club-logo">Logo URL (optional)</Label>
                <Input id="club-logo" type="url" placeholder="https://…" {...register("logo")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="club-cover">Cover image URL (optional)</Label>
                <Input id="club-cover" type="url" placeholder="https://…" {...register("coverImage")} />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || success}>
                {isSubmitting ? "Creating…" : "Create club"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
