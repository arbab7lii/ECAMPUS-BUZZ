import { Router } from "express";
import { authRouter } from "@/modules/auth/auth.router";
import { healthRouter } from "@/modules/health/health.router";

export const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use("/auth", authRouter);

