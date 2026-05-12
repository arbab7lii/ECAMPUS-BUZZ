"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { AuthApiError, loginRequest } from "@/lib/auth-client";
import { loginFormSchema, type LoginFormValues } from "@/lib/auth-form-schemas";

export function LoginForm() {
  const router = useRouter();
  const { isAuthenticated, setAuthFromPayload, status, user } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" }
  });

  useEffect(() => {
    if (status !== "loading" && isAuthenticated && user) {
      router.replace(user.onboardingCompleted ? "/home" : "/onboarding");
    }
  }, [isAuthenticated, router, status, user]);

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setSuccess(false);
    try {
      const data = await loginRequest(values);
      setAuthFromPayload(data);
      setSuccess(true);
      window.setTimeout(() => {
        router.push(data.user.onboardingCompleted ? "/home" : "/onboarding");
      }, 900);
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
      title="Welcome back"
      subtitle="Sign in with your campus credentials."
      alternateHref="/signup"
      alternateLabel="Create an account"
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
            Signed in successfully. Redirecting…
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
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="login-email-error" className="text-sm text-[hsl(var(--destructive))]">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...register("password")}
          />
          {errors.password ? (
            <p id="login-password-error" className="text-sm text-[hsl(var(--destructive))]">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || success}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
