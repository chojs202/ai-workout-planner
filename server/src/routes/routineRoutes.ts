import { Router } from "express";
import {
  createRoutine,
  deleteRoutine,
  getRoutineById,
  getRoutines,
  updateRoutine,
} from "../controllers/routineController.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const routineRouter = Router();

routineRouter.get("/", requireAuth, getRoutines);
routineRouter.get("/:routineId", requireAuth, getRoutineById);
routineRouter.post("/", requireAuth, createRoutine);
routineRouter.put("/:routineId", requireAuth, updateRoutine);
routineRouter.delete("/:routineId", requireAuth, deleteRoutine);