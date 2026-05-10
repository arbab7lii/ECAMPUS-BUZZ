import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

/** The safe user object — never includes passwordHash */
export type SafeUser = Omit<User, "passwordHash">;

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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true
      }
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true
      }
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
};

