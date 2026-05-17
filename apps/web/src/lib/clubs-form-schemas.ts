import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createClubFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80).trim(),
  slug: z.union([z.string().regex(slugRegex, "Use lowercase letters, numbers, and hyphens only").max(80), z.literal("")]).optional(),
  description: z.string().max(2000).trim().optional(),
  tags: z.string().max(200).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  logo: z.union([z.string().url(), z.literal("")]).optional(),
  coverImage: z.union([z.string().url(), z.literal("")]).optional()
});

export type CreateClubFormValues = z.infer<typeof createClubFormSchema>;
