import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { ClubsDirectory } from "@/components/clubs/clubs-directory";
import { RequireOnboardingComplete } from "@/components/profile/require-onboarding-complete";

export const metadata: Metadata = {
  title: "Clubs — ECAMPUS Buzz",
  description: "Discover and join campus clubs"
};

export default function ClubsPage() {
  return (
    <AuthGuard>
      <RequireOnboardingComplete>
        <ClubsDirectory />
      </RequireOnboardingComplete>
    </AuthGuard>
  );
}
