import type { ClubVisibility, MembershipStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PAGINATION } from "@/config/constants";

import {
  clubCardSelect,
  clubDetailSelect,
  membershipPublicSelect,
  type ClubCard,
  type ClubDetail,
  type MembershipPublic
} from "./club.select";

export const clubRepository = {
  async slugExists(slug: string): Promise<boolean> {
    const count = await prisma.club.count({ where: { slug } });
    return count > 0;
  },

  async findById(id: string): Promise<ClubDetail | null> {
    return prisma.club.findUnique({
      where: { id },
      select: clubDetailSelect
    });
  },

  async findBySlug(slug: string): Promise<ClubDetail | null> {
    return prisma.club.findUnique({
      where: { slug },
      select: clubDetailSelect
    });
  },

  async list(params: {
    page: number;
    limit: number;
    q?: string;
  }): Promise<{ clubs: ClubCard[]; total: number }> {
    const limit = Math.min(params.limit, PAGINATION.maxLimit);
    const skip = (params.page - 1) * limit;

    const where: Prisma.ClubWhereInput = params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { description: { contains: params.q, mode: "insensitive" } },
            { tags: { has: params.q } }
          ]
        }
      : {};

    const [clubs, total] = await Promise.all([
      prisma.club.findMany({
        where,
        select: clubCardSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.club.count({ where })
    ]);

    return { clubs, total };
  },

  async create(data: {
    name: string;
    slug: string;
    description?: string | null;
    tags: string[];
    visibility: ClubVisibility;
    logo?: string | null;
    coverImage?: string | null;
    createdBy: string;
  }): Promise<ClubDetail> {
    return prisma.club.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        tags: data.tags,
        visibility: data.visibility,
        logo: data.logo,
        coverImage: data.coverImage,
        createdBy: data.createdBy,
        members: {
          create: {
            userId: data.createdBy,
            role: "ADMIN",
            status: "APPROVED"
          }
        }
      },
      select: clubDetailSelect
    });
  },

  async update(id: string, data: Prisma.ClubUpdateInput): Promise<ClubDetail> {
    return prisma.club.update({
      where: { id },
      data,
      select: clubDetailSelect
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.club.delete({ where: { id } });
  },

  async findMembership(userId: string, clubId: string) {
    return prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId } },
      select: membershipPublicSelect
    });
  },

  async createMembership(data: {
    userId: string;
    clubId: string;
    role: "MEMBER" | "ADMIN";
    status: MembershipStatus;
  }): Promise<MembershipPublic> {
    return prisma.clubMembership.create({
      data,
      select: membershipPublicSelect
    });
  },

  async updateMembership(
    clubId: string,
    userId: string,
    data: Prisma.ClubMembershipUpdateInput
  ): Promise<MembershipPublic> {
    return prisma.clubMembership.update({
      where: { userId_clubId: { userId, clubId } },
      data,
      select: membershipPublicSelect
    });
  },

  async deleteMembership(clubId: string, userId: string): Promise<void> {
    await prisma.clubMembership.delete({
      where: { userId_clubId: { userId, clubId } }
    });
  },

  async listMembers(clubId: string): Promise<MembershipPublic[]> {
    return prisma.clubMembership.findMany({
      where: { clubId },
      select: membershipPublicSelect,
      orderBy: [{ status: "asc" }, { createdAt: "asc" }]
    });
  },

  async countClubAdmins(clubId: string): Promise<number> {
    return prisma.clubMembership.count({
      where: { clubId, role: "ADMIN", status: "APPROVED" }
    });
  }
};
