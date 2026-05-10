import { Router } from "express";
import { healthRouter } from "@/modules/health/health.router";

export const v1Router = Router();

v1Router.use(healthRouter);

