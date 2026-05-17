import { Router } from "express";
import { authRouter } from "@/modules/auth/auth.router";
import { healthRouter } from "@/modules/health/health.router";
import { clubsRouter } from "@/modules/clubs/club.router";
import { profileRouter } from "@/modules/profile/profile.router";

export const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/profile", profileRouter);
v1Router.use("/clubs", clubsRouter);

