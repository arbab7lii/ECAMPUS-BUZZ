import { Router } from "express";

import { requireAuth } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";

import { getProfile, patchProfile, postOnboarding } from "./profile.controller";
import { onboardingCompleteSchema, profileUpdateSchema } from "./profile.schema";

export const profileRouter = Router();

profileRouter.get("/", requireAuth, getProfile);
profileRouter.patch("/", requireAuth, validate(profileUpdateSchema), patchProfile);
profileRouter.post("/onboarding", requireAuth, validate(onboardingCompleteSchema), postOnboarding);
