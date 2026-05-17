import type { NextFunction, Request, Response } from "express";
import type { MembershipRole, MembershipStatus } from "@prisma/client";

import { clubIdParam } from "@/modules/clubs/club.params";
import { clubRepository } from "@/modules/clubs/club.repository";
import type { MembershipPublic } from "@/modules/clubs/club.select";

function forbidden(message = "You do not have permission for this action."): Error {
  const err = new Error(message);
  (err as any).statusCode = 403;
  return err;
}

function notFound(message = "Club not found."): Error {
  const err = new Error(message);
  (err as any).statusCode = 404;
  return err;
}

export type ClubRequestContext = {
  clubId: string;
  membership: MembershipPublic | null;
};

declare global {
  namespace Express {
    interface Request {
      clubContext?: ClubRequestContext;
    }
  }
}

async function loadClubContext(req: Request, paramKey: string): Promise<ClubRequestContext> {
  const clubId = paramKey === "id" ? clubIdParam(req) : String(req.params[paramKey] ?? "");

  const club = await clubRepository.findById(clubId);
  if (!club) {
    throw notFound();
  }

  let membership: MembershipPublic | null = null;
  if (req.user) {
    membership = await clubRepository.findMembership(req.user.id, club.id);
  }

  return { clubId: club.id, membership };
}

/** Requires approved membership on the club (param `id` = club UUID). */
export function requireClubMember(paramKey = "id") {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        const err = new Error("Authentication required. Please log in.");
        (err as any).statusCode = 401;
        return next(err);
      }

      const ctx = await loadClubContext(req, paramKey);
      if (!ctx.membership || ctx.membership.status !== "APPROVED") {
        return next(forbidden("You must be an approved member of this club."));
      }

      req.clubContext = ctx;
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Requires club ADMIN membership (or platform SUPER_ADMIN). */
export function requireClubAdmin(paramKey = "id") {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        const err = new Error("Authentication required. Please log in.");
        (err as any).statusCode = 401;
        return next(err);
      }

      if (req.user.role === "SUPER_ADMIN") {
        const ctx = await loadClubContext(req, paramKey);
        req.clubContext = ctx;
        return next();
      }

      const ctx = await loadClubContext(req, paramKey);
      const isAdmin =
        ctx.membership?.status === "APPROVED" &&
        ctx.membership.role === ("ADMIN" satisfies MembershipRole);

      if (!isAdmin) {
        return next(forbidden("Club admin access required."));
      }

      req.clubContext = ctx;
      next();
    } catch (e) {
      next(e);
    }
  };
}

export function isApprovedMember(
  membership: MembershipPublic | null
): membership is MembershipPublic & { status: "APPROVED" } {
  return membership?.status === ("APPROVED" satisfies MembershipStatus);
}
