"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import type { AuthUser } from "@/lib/auth-client";
import { AuthApiError } from "@/lib/auth-client";
import { profileSettingsSchema, type ProfileSettingsFormValues } from "@/lib/profile-form-schemas";
import { fetchProfileApi, patchProfileApi } from "@/lib/profile-api";
import { cn } from "@/lib/utils";

const GRAD_YEARS = Array.from({ length: 2038 - 2015 + 1 }, (_, i) => 2038 - i);

const selectClass =
  "flex h-12 w-full appearance-none rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 text-sm text-[hsl(var(--foreground))] shadow-inner shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50";

function mapUserToForm(u: AuthUser): ProfileSettingsFormValues {
  return {
    displayName: (u.displayName ?? u.name ?? "").trim(),
    username: (u.username ?? "").trim(),
    bio: u.bio ?? "",
    college: u.college ?? "",
    branch: u.branch ?? "",
    graduationYear: u.graduationYear != null ? String(u.graduationYear) : "",
    avatarUrl: u.avatarUrl ?? ""
  };
}

export function ProfileSettingsForm() {
  const { user, accessToken, updateUser } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProfileSettingsFormValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      displayName: "",
      username: "",
      bio: "",
      college: "",
      branch: "",
      graduationYear: "",
      avatarUrl: ""
    }
  });

  useEffect(() => {
    if (user) {
      reset(mapUserToForm(user));
    }
  }, [user, reset]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void fetchProfileApi(accessToken)
      .then((r) => {
        if (cancelled) return;
        updateUser(r.profile);
        reset(mapUserToForm(r.profile));
        setLoadError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Could not refresh profile from the server.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, reset, updateUser]);

  const onSubmit = handleSubmit(async (values) => {
    if (!accessToken) return;
    setApiError(null);
    setSuccess(false);
    try {
      const patch: Record<string, unknown> = {
        displayName: values.displayName.trim(),
        username: values.username.trim(),
        bio: values.bio?.trim() ? values.bio.trim() : null,
        college: values.college?.trim() ? values.college.trim() : null,
        branch: values.branch?.trim() ? values.branch.trim() : null,
        graduationYear:
          values.graduationYear === undefined || values.graduationYear === ""
            ? null
            : Number(values.graduationYear),
        avatarUrl: values.avatarUrl?.trim() ? values.avatarUrl.trim() : null
      };

      const { profile } = await patchProfileApi(accessToken, patch);
      updateUser(profile);
      reset(mapUserToForm(profile));
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      if (e instanceof AuthApiError) {
        setApiError(e.message);
      } else {
        setApiError("Network error. Please try again.");
      }
    }
  });

  if (!user) {
    return null;
  }

  return (
    <main className="buzz-shell py-10 sm:py-14">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
            Profile
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">
            {user.displayName ?? user.name}
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-[var(--radius-pill)] border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Role: {user.role.toLowerCase().replace(/_/g, " ")}
          </span>
          <Link
            href="/home"
            className="text-sm font-medium text-[hsl(var(--primary))] underline-offset-4 hover:underline"
          >
            ← Home
          </Link>
          {!user.onboardingCompleted ? (
            <Link
              href="/onboarding"
              className="text-sm font-medium text-[hsl(var(--accent))] underline-offset-4 hover:underline"
            >
              Finish onboarding →
            </Link>
          ) : null}
        </div>
      </div>

      <Card className="buzz-glass shadow-[var(--shadow-soft)] ring-1 ring-[hsl(var(--primary)/0.12)]">
        <CardContent className="space-y-6 p-6 sm:p-8">
          {loadError ? (
            <p role="status" className="text-sm text-[hsl(var(--warning))]">
              {loadError}
            </p>
          ) : null}

          <div aria-live="polite" className="min-h-[1.25rem] space-y-2">
            {apiError ? (
              <p
                role="alert"
                className="rounded-[var(--radius-card)] border border-[hsl(var(--destructive)/0.45)] bg-[hsl(var(--destructive)/0.12)] px-3 py-2 text-sm text-[hsl(var(--destructive-foreground))]"
              >
                {apiError}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-[var(--radius-card)] border border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.12)] px-3 py-2 text-sm text-[hsl(var(--foreground))]">
                Profile saved successfully.
              </p>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate aria-busy={isSubmitting}>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pf-display">Display name</Label>
              <Input
                id="pf-display"
                autoComplete="nickname"
                aria-invalid={errors.displayName ? "true" : "false"}
                {...register("displayName")}
              />
              {errors.displayName ? (
                <p className="text-sm text-[hsl(var(--destructive))]">{errors.displayName.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pf-user">Username</Label>
              <Input
                id="pf-user"
                autoComplete="username"
                aria-invalid={errors.username ? "true" : "false"}
                {...register("username")}
              />
              {errors.username ? (
                <p className="text-sm text-[hsl(var(--destructive))]">{errors.username.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pf-bio">Bio</Label>
              <Textarea id="pf-bio" rows={4} {...register("bio")} />
              {errors.bio ? <p className="text-sm text-[hsl(var(--destructive))]">{errors.bio.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-college">College</Label>
              <Input id="pf-college" {...register("college")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-branch">Branch</Label>
              <Input id="pf-branch" {...register("branch")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-year">Graduation year</Label>
              <select id="pf-year" className={cn(selectClass)} {...register("graduationYear")}>
                <option value="">Not specified</option>
                {GRAD_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {errors.graduationYear ? (
                <p className="text-sm text-[hsl(var(--destructive))]">{errors.graduationYear.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pf-avatar">Avatar URL</Label>
              <Input id="pf-avatar" type="url" placeholder="https://…" {...register("avatarUrl")} />
              {errors.avatarUrl ? (
                <p className="text-sm text-[hsl(var(--destructive))]">{errors.avatarUrl.message}</p>
              ) : null}
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Paste a hosted image URL. Full upload pipeline ships in a later release.
              </p>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
