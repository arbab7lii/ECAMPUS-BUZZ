import { Router } from "express";
import { templateController } from "./template.controller";

export const templateRouter = Router();

// Intentionally empty scaffold route (remove when implementing a real module)
templateRouter.get("/__scaffold", templateController.placeholder);

