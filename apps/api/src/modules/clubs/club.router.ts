import { Router } from "express";

import { requireAuth, optionalAuth } from "@/middleware/auth.middleware";
import { requireClubAdmin, requireClubMember } from "@/middleware/club.middleware";
import { requireRole } from "@/middleware/rbac.middleware";
import { validate } from "@/middleware/validate.middleware";

import {
  createClub,
  deleteClub,
  getClubBySlug,
  joinClub,
  leaveClub,
  listClubs,
  listMembers,
  patchMember,
  removeMember,
  requestJoin,
  updateClub
} from "./club.controller";
import {
  clubIdParamsSchema,
  clubMemberParamsSchema,
  clubSlugParamsSchema,
  createClubSchema,
  listClubsQuerySchema,
  updateClubSchema,
  updateMemberSchema
} from "./club.schema";

export const clubsRouter = Router();

// ─── Collection ───────────────────────────────────────────────────────────────

clubsRouter.get("/", optionalAuth, validate(listClubsQuerySchema, "query"), listClubs);
clubsRouter.post("/", requireAuth, validate(createClubSchema), createClub);

// ─── Authenticated (multi-segment paths before /:slug) ──────────────────────────

clubsRouter.patch(
  "/:id",
  requireAuth,
  validate(clubIdParamsSchema, "params"),
  requireClubAdmin("id"),
  validate(updateClubSchema),
  updateClub
);

clubsRouter.delete(
  "/:id",
  requireAuth,
  validate(clubIdParamsSchema, "params"),
  requireRole("SUPER_ADMIN"),
  deleteClub
);

clubsRouter.post("/:id/join", requireAuth, validate(clubIdParamsSchema, "params"), joinClub);
clubsRouter.post("/:id/request", requireAuth, validate(clubIdParamsSchema, "params"), requestJoin);
clubsRouter.post("/:id/leave", requireAuth, validate(clubIdParamsSchema, "params"), leaveClub);

clubsRouter.get(
  "/:id/members",
  requireAuth,
  validate(clubIdParamsSchema, "params"),
  requireClubMember("id"),
  listMembers
);
clubsRouter.patch(
  "/:id/members/:userId",
  requireAuth,
  requireClubAdmin("id"),
  validate(clubMemberParamsSchema, "params"),
  validate(updateMemberSchema),
  patchMember
);
clubsRouter.delete(
  "/:id/members/:userId",
  requireAuth,
  requireClubAdmin("id"),
  validate(clubMemberParamsSchema, "params"),
  removeMember
);

// ─── Slug detail (register last — single-segment catch-all) ───────────────────

clubsRouter.get("/:slug", optionalAuth, validate(clubSlugParamsSchema, "params"), getClubBySlug);
