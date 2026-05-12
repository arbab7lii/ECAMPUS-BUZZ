"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { AuthApiError } from "@/lib/auth-client";
import { onboardingFormSchema, type OnboardingFormValues } from "@/lib/profile-form-schemas";
import { completeOnboardingApi } from "@/lib/profile-api";
import { cn } from "@/lib/utils";

const GRAD_YEARS = Array.from({ length: 2038 - 2015 + 1 }, (_, i) => 2038 - i);

const selectClass =
  "flex h-12 w-full appearance-none rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 text-sm text-[hsl(var(--foreground))] shadow-inner shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50";

export function OnboardingForm() {
  const router = useRouter();
  const { accessToken, updateUser } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      displayName: "",
      username: "",
      bio: "",
      college: "",
      branch: "",
      graduationYear: 2028,
      avatarUrl: ""
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!accessToken) return;
    setApiError(null);
    setSuccess(false);
    try {
      const body: Record<string, unknown> = {
        displayName: values.displayName.trim(),
        username: values.username.trim(),
        college: values.college.trim(),
        branch: values.branch.trim(),
        graduationYear: values.graduationYear
      };
      if (values.bio?.trim()) body.bio = values.bio.trim();
      if (values.avatarUrl?.trim()) body.avatarUrl = values.avatarUrl.trim();

      const { profile } = await completeOnboardingApi(accessToken, body);
      updateUser(profile);
      setSuccess(true);
      window.setTimeout(() => router.replace("/home"), 900);
    } catch (e) {
      if (e instanceof AuthApiError) {
        setApiError(e.message);
      } else {
        setApiError("Network error. Please try again.");
      }
    }
  });

  return (
    <AuthPageShell
      title="Complete your profile"
      subtitle="A few details unlock your campus identity."
      alternateHref="/profile"
      alternateLabel="Open profile settings"
    >
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
            Profile saved. Entering campus…
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate aria-busy={isSubmitting}>
        <div className="space-y-2">
          <Label htmlFor="onb-display">Display name</Label>
          <Input
            id="onb-display"
            autoComplete="nickname"
            aria-invalid={errors.displayName ? "true" : "false"}
            aria-describedby={errors.displayName ? "onb-display-err" : undefined}
            {...register("displayName")}
          />
          {errors.displayName ? (
            <p id="onb-display-err" className="text-sm text-[hsl(var(--destructive))]">
              {errors.displayName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="onb-user">Username</Label>
          <Input
            id="onb-user"
            autoComplete="username"
            aria-invalid={errors.username ? "true" : "false"}
            aria-describedby={errors.username ? "onb-user-err" : undefined}
            {...register("username")}
          />
          {errors.username ? (
            <p id="onb-user-err" className="text-sm text-[hsl(var(--destructive))]">
              {errors.username.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="onb-college">College</Label>
          <Input
            id="onb-college"
            aria-invalid={errors.college ? "true" : "false"}
            aria-describedby={errors.college ? "onb-college-err" : undefined}
            {...register("college")}
          />
          {errors.college ? (
            <p id="onb-college-err" className="text-sm text-[hsl(var(--destructive))]">
              {errors.college.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="onb-branch">Branch / program</Label>
          <Input
            id="onb-branch"
            aria-invalid={errors.branch ? "true" : "false"}
            aria-describedby={errors.branch ? "onb-branch-err" : undefined}
            {...register("branch")}
          />
          {errors.branch ? (
            <p id="onb-branch-err" className="text-sm text-[hsl(var(--destructive))]">
              {errors.branch.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="onb-year">Graduation year</Label>
          <select id="onb-year" className={cn(selectClass)} {...register("graduationYear", { valueAsNumber: true })}>
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
          <Label htmlFor="onb-bio">Bio (optional)</Label>
          <Textarea id="onb-bio" rows={3} {...register("bio")} />
          {errors.bio ? <p className="text-sm text-[hsl(var(--destructive))]">{errors.bio.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="onb-avatar">Avatar URL (optional)</Label>
          <Input
            id="onb-avatar"
            type="url"
            placeholder="https://…"
            aria-invalid={errors.avatarUrl ? "true" : "false"}
            {...register("avatarUrl")}
          />
          {errors.avatarUrl ? (
            <p className="text-sm text-[hsl(var(--destructive))]">{errors.avatarUrl.message}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || success}>
          {isSubmitting ? "Saving…" : "Finish onboarding"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
