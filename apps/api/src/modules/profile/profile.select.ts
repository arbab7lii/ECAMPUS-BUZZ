import type { Prisma } from "@prisma/client";

/** Public user fields returned by auth/me and profile APIs (no passwordHash). */
export const publicProfileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  bio: true,
  displayName: true,
  username: true,
  college: true,
  branch: true,
  graduationYear: true,
  avatarUrl: true,
  onboardingCompleted: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

export type PublicProfile = Prisma.UserGetPayload<{ select: typeof publicProfileSelect }>;
