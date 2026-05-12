import { z } from "zod";

const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;

/** Partial profile update (PATCH /profile). */
export const profileUpdateSchema = z
  .object({
    displayName: z.union([z.string().min(2).max(60).trim(), z.null()]).optional(),
    username: z.union([z.string().regex(usernameRegex, "Invalid username format"), z.null()]).optional(),
    bio: z.union([z.string().max(500).trim(), z.null()]).optional(),
    college: z.union([z.string().min(1).max(120).trim(), z.null()]).optional(),
    branch: z.union([z.string().min(1).max(120).trim(), z.null()]).optional(),
    graduationYear: z.union([z.number().int().min(1950).max(2100), z.null()]).optional(),
    avatarUrl: z.union([z.string().url(), z.null()]).optional(),
    onboardingCompleted: z.boolean().optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/** Complete onboarding in one request (POST /profile/onboarding). */
export const onboardingCompleteSchema = z
  .object({
    displayName: z.string().min(2).max(60).trim(),
    username: z.string().regex(usernameRegex, "Invalid username format"),
    bio: z.union([z.string().max(500).trim(), z.literal("")]).optional(),
    college: z.string().min(1).max(120).trim(),
    branch: z.string().min(1).max(120).trim(),
    graduationYear: z.number().int().min(1950).max(2100),
    avatarUrl: z.union([z.string().url(), z.literal("")]).optional()
  })
  .strict();

export type OnboardingCompleteInput = z.infer<typeof onboardingCompleteSchema>;
