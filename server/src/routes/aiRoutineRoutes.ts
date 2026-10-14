import { Router } from "express";
import {
  generateRoutine,
  generateWorkoutFeedback,
} from "../controllers/aiRoutineController.js";
import {
  requireAuth,
} from "../middleware/requireAuth.js";
import {
  aiRateLimiter,
} from "../middleware/rateLimiters.js";

export const aiRoutineRouter = Router();

aiRoutineRouter.post(
  "/generate",
  requireAuth,
  aiRateLimiter,
  generateRoutine,
);

aiRoutineRouter.post(
  "/feedback",
  requireAuth,
  aiRateLimiter,
  generateWorkoutFeedback,
);