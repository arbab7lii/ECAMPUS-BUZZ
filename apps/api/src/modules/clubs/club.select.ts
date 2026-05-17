import type { MembershipStatus, Prisma } from "@prisma/client";

export const approvedMemberCount = {
  where: { status: "APPROVED" as MembershipStatus }
};

export const clubCardSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  coverImage: true,
  description: true,
  tags: true,
  visibility: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      members: approvedMemberCount
    }
  }
} satisfies Prisma.ClubSelect;

export const clubDetailSelect = {
  ...clubCardSelect,
  creator: {
    select: {
      id: true,
      name: true,
      displayName: true,
      username: true,
      avatarUrl: true
    }
  }
} satisfies Prisma.ClubSelect;

export type ClubCard = Prisma.ClubGetPayload<{ select: typeof clubCardSelect }>;
export type ClubDetail = Prisma.ClubGetPayload<{ select: typeof clubDetailSelect }>;

export const membershipPublicSelect = {
  id: true,
  userId: true,
  clubId: true,
  role: true,
  status: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      role: true
    }
  }
} satisfies Prisma.ClubMembershipSelect;

export type MembershipPublic = Prisma.ClubMembershipGetPayload<{
  select: typeof membershipPublicSelect;
}>;
