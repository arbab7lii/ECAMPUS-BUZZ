import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { CreateClubForm } from "@/components/clubs/create-club-form";
import { RequireOnboardingComplete } from "@/components/profile/require-onboarding-complete";

export const metadata: Metadata = {
  title: "Create club — ECAMPUS Buzz",
  description: "Start a new campus club"
};

export default function NewClubPage() {
  return (
    <AuthGuard>
      <RequireOnboardingComplete>
        <CreateClubForm />
      </RequireOnboardingComplete>
    </AuthGuard>
  );
}
