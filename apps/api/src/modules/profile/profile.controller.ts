import type { NextFunction, Request, Response } from "express";

import type { OnboardingCompleteInput, ProfileUpdateInput } from "./profile.schema";
import { profileService } from "./profile.service";

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await profileService.getProfile(req.user!.id);
    res.json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
}

export async function patchProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = (req as Request & { validated?: ProfileUpdateInput }).validated!;
    const profile = await profileService.updateProfile(req.user!.id, input);
    res.json({
      success: true,
      data: { profile },
      message: "Profile updated"
    });
  } catch (error) {
    next(error);
  }
}

export async function postOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = (req as Request & { validated?: OnboardingCompleteInput }).validated!;
    const profile = await profileService.completeOnboarding(req.user!.id, input);
    res.status(201).json({
      success: true,
      data: { profile },
      message: "Onboarding completed"
    });
  } catch (error) {
    next(error);
  }
}
