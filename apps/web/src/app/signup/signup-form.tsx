"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthApiError, registerRequest } from "@/lib/auth-client";
import { signupFormSchema, type SignupFormValues } from "@/lib/auth-form-schemas";
import { persistAccessToken } from "@/lib/auth-session";

export function SignupForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: "", email: "", password: "" }
  });

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setSuccess(false);
    try {
      const data = await registerRequest(values);
      persistAccessToken(data.accessToken);
      setSuccess(true);
      window.setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (e) {
      if (e instanceof AuthApiError) {
        setApiError(e.message);
      } else {
        setApiError("Network error. Check API URL and CORS settings.");
      }
    }
  });

  return (
    <AuthPageShell
      title="Create your account"
      subtitle="Join the campus network in seconds."
      alternateHref="/login"
      alternateLabel="Already have an account? Sign in"
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
            Account created. You&apos;re signed in — redirecting…
          </p>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4"
        noValidate
        aria-busy={isSubmitting}
      >
        <div className="space-y-2">
          <Label htmlFor="signup-name">Display name</Label>
          <Input
            id="signup-name"
            type="text"
            autoComplete="name"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "signup-name-error" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p id="signup-name-error" className="text-sm text-[hsl(var(--destructive))]">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="signup-email-error" className="text-sm text-[hsl(var(--destructive))]">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "signup-password-error" : undefined}
            {...register("password")}
          />
          {errors.password ? (
            <p id="signup-password-error" className="text-sm text-[hsl(var(--destructive))]">
              {errors.password.message}
            </p>
          ) : null}
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            8+ characters with uppercase, lowercase, and a number.
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || success}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
