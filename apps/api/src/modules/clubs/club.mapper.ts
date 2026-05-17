import type { ClubCard, ClubDetail, MembershipPublic } from "./club.select";

export type SerializedClub = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  tags: string[];
  visibility: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  creator?: ClubDetail["creator"];
};

export type SerializedMembership = {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  status: string;
  createdAt: string;
  user: MembershipPublic["user"];
};

function toIso(d: Date): string {
  return d.toISOString();
}

export function mapClub(
  club: ClubCard | ClubDetail,
  extras?: { viewerMembership?: MembershipPublic | null }
): SerializedClub & { viewerMembership?: SerializedMembership | null } {
  const base: SerializedClub = {
    id: club.id,
    name: club.name,
    slug: club.slug,
    logo: club.logo,
    coverImage: club.coverImage,
    description: club.description,
    tags: club.tags,
    visibility: club.visibility,
    createdBy: club.createdBy,
    createdAt: toIso(club.createdAt),
    updatedAt: toIso(club.updatedAt),
    memberCount: club._count.members,
    ...("creator" in club && club.creator ? { creator: club.creator } : {})
  };

  if (extras?.viewerMembership !== undefined) {
    return {
      ...base,
      viewerMembership: extras.viewerMembership
        ? mapMembership(extras.viewerMembership)
        : null
    };
  }

  return base;
}

export function mapMembership(m: MembershipPublic): SerializedMembership {
  return {
    id: m.id,
    userId: m.userId,
    clubId: m.clubId,
    role: m.role,
    status: m.status,
    createdAt: toIso(m.createdAt),
    user: m.user
  };
}
