import type { UserRole } from "@prisma/client";

import { PAGINATION } from "@/config/constants";

import { clubRepository } from "./club.repository";
import { mapClub, mapMembership } from "./club.mapper";
import type { CreateClubInput, ListClubsQuery, UpdateClubInput, UpdateMemberInput } from "./club.schema";
import { ensureUniqueSlug, slugifyName } from "./club.utils";

function appError(statusCode: number, message: string): Error {
  const err = new Error(message);
  (err as any).statusCode = statusCode;
  return err;
}

function isPrismaUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

export const clubService = {
  async list(query: ListClubsQuery, viewerId?: string) {
    const limit = Math.min(query.limit, PAGINATION.maxLimit);
    const { clubs, total } = await clubRepository.list({
      page: query.page,
      limit,
      q: query.q
    });

    const items = await Promise.all(
      clubs.map(async (club) => {
        const viewerMembership = viewerId
          ? await clubRepository.findMembership(viewerId, club.id)
          : null;
        return mapClub(club, { viewerMembership });
      })
    );

    return {
      clubs: items,
      pagination: {
        page: query.page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  },

  async getBySlug(slug: string, viewerId?: string) {
    const club = await clubRepository.findBySlug(slug);
    if (!club) {
      throw appError(404, "Club not found");
    }

    const viewerMembership = viewerId
      ? await clubRepository.findMembership(viewerId, club.id)
      : null;

    return mapClub(club, { viewerMembership });
  },

  async create(userId: string, input: CreateClubInput) {
    const baseSlug = input.slug?.trim() || slugifyName(input.name);
    if (!baseSlug) {
      throw appError(400, "Could not generate a valid slug from the club name.");
    }

    const slug = await ensureUniqueSlug(baseSlug, (s) => clubRepository.slugExists(s));

    const logo = input.logo === "" || !input.logo ? null : input.logo;
    const coverImage = input.coverImage === "" || !input.coverImage ? null : input.coverImage;

    try {
      const club = await clubRepository.create({
        name: input.name,
        slug,
        description: input.description ?? null,
        tags: input.tags,
        visibility: input.visibility,
        logo,
        coverImage,
        createdBy: userId
      });

      const membership = await clubRepository.findMembership(userId, club.id);
      return mapClub(club, { viewerMembership: membership });
    } catch (err) {
      if (isPrismaUniqueViolation(err)) {
        throw appError(409, "A club with this slug already exists.");
      }
      throw err;
    }
  },

  async update(clubId: string, input: UpdateClubInput) {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.visibility !== undefined) data.visibility = input.visibility;
    if (input.logo !== undefined) data.logo = input.logo;
    if (input.coverImage !== undefined) data.coverImage = input.coverImage;

    const club = await clubRepository.update(clubId, data as any);
    return mapClub(club);
  },

  async deleteClub(clubId: string, actorRole: UserRole) {
    if (actorRole !== "SUPER_ADMIN") {
      throw appError(403, "Only a super admin can delete clubs.");
    }
    await clubRepository.delete(clubId);
  },

  async joinPublic(clubId: string, userId: string) {
    const club = await clubRepository.findById(clubId);
    if (!club) {
      throw appError(404, "Club not found");
    }
    if (club.visibility !== "PUBLIC") {
      throw appError(400, "This club is private. Submit a join request instead.");
    }

    const existing = await clubRepository.findMembership(userId, clubId);
    if (existing) {
      if (existing.status === "APPROVED") {
        throw appError(409, "You are already a member of this club.");
      }
      if (existing.status === "PENDING") {
        throw appError(409, "Your join request is already pending.");
      }
      if (existing.status === "REJECTED" || existing.status === "REMOVED") {
        const updated = await clubRepository.updateMembership(clubId, userId, {
          status: "APPROVED",
          role: "MEMBER"
        });
        return mapMembership(updated);
      }
    }

    const membership = await clubRepository.createMembership({
      userId,
      clubId,
      role: "MEMBER",
      status: "APPROVED"
    });
    return mapMembership(membership);
  },

  async requestPrivate(clubId: string, userId: string) {
    const club = await clubRepository.findById(clubId);
    if (!club) {
      throw appError(404, "Club not found");
    }
    if (club.visibility !== "PRIVATE") {
      throw appError(400, "This club is public. Use join instead.");
    }

    const existing = await clubRepository.findMembership(userId, clubId);
    if (existing) {
      if (existing.status === "APPROVED") {
        throw appError(409, "You are already a member of this club.");
      }
      if (existing.status === "PENDING") {
        throw appError(409, "Your join request is already pending.");
      }
      if (existing.status === "REJECTED" || existing.status === "REMOVED") {
        const updated = await clubRepository.updateMembership(clubId, userId, {
          status: "PENDING",
          role: "MEMBER"
        });
        return mapMembership(updated);
      }
    }

    const membership = await clubRepository.createMembership({
      userId,
      clubId,
      role: "MEMBER",
      status: "PENDING"
    });
    return mapMembership(membership);
  },

  async leave(clubId: string, userId: string) {
    const club = await clubRepository.findById(clubId);
    if (!club) {
      throw appError(404, "Club not found");
    }

    const membership = await clubRepository.findMembership(userId, clubId);
    if (!membership || membership.status !== "APPROVED") {
      throw appError(400, "You are not an active member of this club.");
    }

    if (membership.role === "ADMIN") {
      const adminCount = await clubRepository.countClubAdmins(clubId);
      if (adminCount <= 1 && club.createdBy === userId) {
        throw appError(
          400,
          "As the only admin, you cannot leave. Transfer admin role or delete the club."
        );
      }
    }

    await clubRepository.deleteMembership(clubId, userId);
  },

  async listMembers(clubId: string) {
    const members = await clubRepository.listMembers(clubId);
    return members.map(mapMembership);
  },

  async updateMember(clubId: string, targetUserId: string, input: UpdateMemberInput) {
    const target = await clubRepository.findMembership(targetUserId, clubId);
    if (!target) {
      throw appError(404, "Member not found in this club.");
    }

    const data: { role?: "MEMBER" | "ADMIN"; status?: typeof target.status } = {};
    if (input.role !== undefined) data.role = input.role;
    if (input.status !== undefined) data.status = input.status;

    if (target.role === "ADMIN" && input.role === "MEMBER") {
      const adminCount = await clubRepository.countClubAdmins(clubId);
      if (adminCount <= 1) {
        throw appError(400, "Cannot demote the only club admin.");
      }
    }

    const updated = await clubRepository.updateMembership(clubId, targetUserId, data);
    return mapMembership(updated);
  },

  async removeMember(clubId: string, targetUserId: string, actorId: string) {
    const club = await clubRepository.findById(clubId);
    if (!club) {
      throw appError(404, "Club not found");
    }

    if (targetUserId === club.createdBy) {
      throw appError(400, "Cannot remove the club creator.");
    }

    const target = await clubRepository.findMembership(targetUserId, clubId);
    if (!target) {
      throw appError(404, "Member not found in this club.");
    }

    if (targetUserId === actorId) {
      throw appError(400, "Use leave to remove yourself from the club.");
    }

    await clubRepository.deleteMembership(clubId, targetUserId);
  }
};
