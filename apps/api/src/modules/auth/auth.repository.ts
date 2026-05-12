import type { User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { publicProfileSelect, type PublicProfile } from "@/modules/profile/profile.select";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

/** The safe user object — never includes passwordHash */
export type SafeUser = PublicProfile;

// ─── Repository ───────────────────────────────────────────────────────────────

export const authRepository = {
  /**
   * Find a user by email.
   * Returns the full record including passwordHash (needed for login comparison).
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    });
  },

  /**
   * Find a user by ID.
   * Returns safe user (no passwordHash).
   */
  async findById(id: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: publicProfileSelect
    });
  },

  /**
   * Create a new user.
   * Accepts pre-hashed password.
   */
  async create(data: CreateUserData): Promise<SafeUser> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash
        // role defaults to STUDENT via Prisma schema default
      },
      select: publicProfileSelect
    });
  },

  /**
   * Check if an email is already registered.
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },

  /**
   * Update user profile.
   */
  async updateById(
    id: string,
    data: Partial<Pick<User, "name" | "avatar" | "bio">>
  ): Promise<SafeUser> {
    return prisma.user.update({
      where: { id },
      data,
      select: publicProfileSelect
    });
  }
};
