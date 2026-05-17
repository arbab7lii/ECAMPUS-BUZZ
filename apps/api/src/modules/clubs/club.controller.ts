import type { NextFunction, Request, Response } from "express";

import type {
  CreateClubInput,
  ListClubsQuery,
  UpdateClubInput,
  UpdateMemberInput
} from "./club.schema";
import { clubIdParam, clubSlugParam, memberUserIdParam } from "./club.params";
import { clubService } from "./club.service";

function getValidated<T>(req: Request): T {
  return (req as Request & { validated?: T }).validated!;
}

export async function listClubs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = getValidated<ListClubsQuery>(req);
    const result = await clubService.list(query, req.user?.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getClubBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slug = clubSlugParam(req);
    const club = await clubService.getBySlug(slug, req.user?.id);
    res.json({ success: true, data: { club } });
  } catch (error) {
    next(error);
  }
}

export async function createClub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = getValidated<CreateClubInput>(req);
    const club = await clubService.create(req.user!.id, input);
    res.status(201).json({
      success: true,
      data: { club },
      message: "Club created successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function updateClub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = getValidated<UpdateClubInput>(req);
    const club = await clubService.update(clubIdParam(req), input);
    res.json({ success: true, data: { club }, message: "Club updated" });
  } catch (error) {
    next(error);
  }
}

export async function deleteClub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await clubService.deleteClub(clubIdParam(req), req.user!.role);
    res.json({ success: true, data: null, message: "Club deleted" });
  } catch (error) {
    next(error);
  }
}

export async function joinClub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const membership = await clubService.joinPublic(clubIdParam(req), req.user!.id);
    res.status(201).json({
      success: true,
      data: { membership },
      message: "Joined club successfully"
    });
  } catch (error) {
    next(error);
  }
}

export async function requestJoin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const membership = await clubService.requestPrivate(clubIdParam(req), req.user!.id);
    res.status(201).json({
      success: true,
      data: { membership },
      message: "Join request submitted"
    });
  } catch (error) {
    next(error);
  }
}

export async function leaveClub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await clubService.leave(clubIdParam(req), req.user!.id);
    res.json({ success: true, data: null, message: "Left club successfully" });
  } catch (error) {
    next(error);
  }
}

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await clubService.listMembers(clubIdParam(req));
    res.json({ success: true, data: { members } });
  } catch (error) {
    next(error);
  }
}

export async function patchMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = getValidated<UpdateMemberInput>(req);
    const membership = await clubService.updateMember(
      clubIdParam(req),
      memberUserIdParam(req),
      input
    );
    res.json({ success: true, data: { membership }, message: "Member updated" });
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await clubService.removeMember(clubIdParam(req), memberUserIdParam(req), req.user!.id);
    res.json({ success: true, data: null, message: "Member removed" });
  } catch (error) {
    next(error);
  }
}
