import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { publicProfileSelect, type PublicProfile } from "./profile.select";

export const profileRepository = {
  async findPublicById(id: string): Promise<PublicProfile | null> {
    return prisma.user.findUnique({
      where: { id },
      select: publicProfileSelect
    });
  },

  async updatePublicProfile(id: string, data: Prisma.UserUpdateInput): Promise<PublicProfile> {
    return prisma.user.update({
      where: { id },
      data,
      select: publicProfileSelect
    });
  },

  async isUsernameTaken(username: string, excludeUserId: string): Promise<boolean> {
    const existing = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: excludeUserId }
      },
      select: { id: true }
    });
    return existing !== null;
  }
};
