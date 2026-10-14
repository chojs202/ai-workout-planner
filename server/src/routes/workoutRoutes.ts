import { Router } from "express";
import {
    completeWorkout,
    deleteWorkout,
    deleteWorkoutExercise,
    getWorkoutById,
    getWorkouts,
    resetWorkoutSet,
    startWorkout,
    updateCompletedWorkout,
    updateWorkoutSet,
} from "../controllers/workoutController.js";
import {
    requireAuth,
} from "../middleware/requireAuth.js";

export const workoutRouter = Router();

workoutRouter.post(
    "/",
    requireAuth,
    startWorkout,
);

workoutRouter.get(
    "/",
    requireAuth,
    getWorkouts,
);

workoutRouter.patch(
    "/:workoutId/sets",
    requireAuth,
    updateWorkoutSet,
);

workoutRouter.patch(
    "/:workoutId",
    requireAuth,
    updateCompletedWorkout,
);

workoutRouter.post(
    "/:workoutId/complete",
    requireAuth,
    completeWorkout,
);

workoutRouter.delete(
    "/:workoutId/exercises/:routineExerciseId",
    requireAuth,
    deleteWorkoutExercise,
);

workoutRouter.delete(
    "/:workoutId/exercises/:routineExerciseId/sets/:setNumber",
    requireAuth,
    resetWorkoutSet,
);

workoutRouter.delete(
    "/:workoutId",
    requireAuth,
    deleteWorkout,
);

workoutRouter.get(
    "/:workoutId",
    requireAuth,
    getWorkoutById,
);

