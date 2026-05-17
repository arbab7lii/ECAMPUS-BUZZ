import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const listClubsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(100).optional()
});

export const createClubSchema = z.object({
  name: z.string().min(2).max(80).trim(),
  slug: z
    .string()
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens")
    .max(80)
    .optional(),
  description: z.string().max(2000).trim().optional(),
  tags: z.array(z.string().min(1).max(40).trim()).max(10).default([]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  logo: z.union([z.string().url(), z.literal("")]).optional(),
  coverImage: z.union([z.string().url(), z.literal("")]).optional()
});

export const updateClubSchema = z
  .object({
    name: z.string().min(2).max(80).trim().optional(),
    description: z.union([z.string().max(2000).trim(), z.null()]).optional(),
    tags: z.array(z.string().min(1).max(40).trim()).max(10).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
    logo: z.union([z.string().url(), z.null()]).optional(),
    coverImage: z.union([z.string().url(), z.null()]).optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });

export const updateMemberSchema = z
  .object({
    role: z.enum(["MEMBER", "ADMIN"]).optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "REMOVED"]).optional()
  })
  .strict()
  .refine((data) => data.role !== undefined || data.status !== undefined, {
    message: "At least one of role or status is required"
  });

export const clubIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const clubSlugParamsSchema = z.object({
  slug: z.string().min(1).max(80)
});

export const clubMemberParamsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid()
});

export type ListClubsQuery = z.infer<typeof listClubsQuerySchema>;
export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
