import type { Prisma } from "@prisma/client";

import type { OnboardingCompleteInput, ProfileUpdateInput } from "./profile.schema";
import { profileRepository } from "./profile.repository";
import type { PublicProfile } from "./profile.select";

function appError(statusCode: number, message: string): Error {
  const err = new Error(message);
  (err as any).statusCode = statusCode;
  return err;
}

function isPrismaUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

export const profileService = {
  async getProfile(userId: string): Promise<PublicProfile> {
    const profile = await profileRepository.findPublicById(userId);
    if (!profile) {
      throw appError(404, "User not found");
    }
    return profile;
  },

  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<PublicProfile> {
    if (input.username !== undefined && input.username !== null) {
      const taken = await profileRepository.isUsernameTaken(input.username, userId);
      if (taken) {
        throw appError(409, "That username is already taken");
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.username !== undefined) data.username = input.username;
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.college !== undefined) data.college = input.college;
    if (input.branch !== undefined) data.branch = input.branch;
    if (input.graduationYear !== undefined) data.graduationYear = input.graduationYear;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
    if (input.onboardingCompleted !== undefined) {
      data.onboardingCompleted = input.onboardingCompleted;
    }

    try {
      return await profileRepository.updatePublicProfile(userId, data);
    } catch (err) {
      if (isPrismaUniqueViolation(err)) {
        throw appError(409, "That username is already taken");
      }
      throw err;
    }
  },

  async completeOnboarding(userId: string, input: OnboardingCompleteInput): Promise<PublicProfile> {
    const taken = await profileRepository.isUsernameTaken(input.username, userId);
    if (taken) {
      throw appError(409, "That username is already taken");
    }

    const bio = input.bio === "" || input.bio === undefined ? null : input.bio;
    const avatarUrl = input.avatarUrl === "" || input.avatarUrl === undefined ? null : input.avatarUrl;

    try {
      return await profileRepository.updatePublicProfile(userId, {
        displayName: input.displayName,
        username: input.username,
        bio,
        college: input.college,
        branch: input.branch,
        graduationYear: input.graduationYear,
        avatarUrl,
        onboardingCompleted: true
      });
    } catch (err) {
      if (isPrismaUniqueViolation(err)) {
        throw appError(409, "That username is already taken");
      }
      throw err;
    }
  }
};
