import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { OnboardingForm } from "@/components/profile/onboarding-form";
import { RequireOnboardingPending } from "@/components/profile/require-onboarding-pending";

export const metadata: Metadata = {
  title: "Onboarding — ECAMPUS Buzz",
  description: "Complete your ECAMPUS Buzz profile"
};

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <RequireOnboardingPending>
        <OnboardingForm />
      </RequireOnboardingPending>
    </AuthGuard>
  );
}
