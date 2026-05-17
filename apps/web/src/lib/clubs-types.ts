export type ClubVisibility = "PUBLIC" | "PRIVATE";

export type MembershipRole = "MEMBER" | "ADMIN";
export type MembershipStatus = "PENDING" | "APPROVED" | "REJECTED" | "REMOVED";

export type ClubMemberUser = {
  id: string;
  name: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  role: string;
};

export type ViewerMembership = {
  id: string;
  userId: string;
  clubId: string;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: string;
  user: ClubMemberUser;
};

export type ClubSummary = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  tags: string[];
  visibility: ClubVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  viewerMembership?: ViewerMembership | null;
  creator?: {
    id: string;
    name: string;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
};

export type ClubsListResponse = {
  clubs: ClubSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
