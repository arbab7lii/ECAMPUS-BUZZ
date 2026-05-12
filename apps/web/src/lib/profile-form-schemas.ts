import { z } from "zod";

const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;

/** Onboarding submit — mirrors API `onboardingCompleteSchema`. */
export const onboardingFormSchema = z.object({
  displayName: z.string().min(2).max(60).trim(),
  username: z.string().regex(usernameRegex, "Use 3–32 letters, numbers, or underscores"),
  bio: z.string().max(500).trim().optional(),
  college: z.string().min(1).max(120).trim(),
  branch: z.string().min(1).max(120).trim(),
  graduationYear: z.number().int().min(1950).max(2100),
  avatarUrl: z.union([z.string().url(), z.literal("")]).optional()
});

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

/** Full profile settings save — maps to PATCH /profile. */
export const profileSettingsSchema = z
  .object({
    displayName: z.string().min(2).max(60).trim(),
    username: z.string().regex(usernameRegex, "Use 3–32 letters, numbers, or underscores"),
    bio: z.string().max(500).trim().optional(),
    college: z.string().max(120).trim().optional(),
    branch: z.string().max(120).trim().optional(),
    graduationYear: z
      .string()
      .optional()
      .refine(
        (s) =>
          s === undefined ||
          s === "" ||
          (!Number.isNaN(Number(s)) && Number(s) >= 1950 && Number(s) <= 2100),
        "Select a valid graduation year"
      ),
    avatarUrl: z.union([z.string().url(), z.literal("")]).optional()
  })
  .strict();

export type ProfileSettingsFormValues = z.infer<typeof profileSettingsSchema>;
