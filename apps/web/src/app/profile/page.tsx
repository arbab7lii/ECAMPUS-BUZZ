import type { Metadata } from "next";

import { AuthGuard } from "@/components/auth/auth-guard";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";

export const metadata: Metadata = {
  title: "Profile — ECAMPUS Buzz",
  description: "Manage your ECAMPUS Buzz profile"
};

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileSettingsForm />
    </AuthGuard>
  );
}
