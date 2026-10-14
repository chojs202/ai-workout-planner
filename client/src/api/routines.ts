import type {
  CreateRoutineRequest,
  Exercise,
  ExerciseSetTarget,
  MuscleGroup,
  Routine,
  RoutineDay,
  RoutineListResponse,
  RoutineResponse,
  UpdateRoutineRequest,
} from "../types/routine";
import {
  ApiRequestError,
  translatedRequest,
} from "./translatedRequest";

const muscleGroups: readonly MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "cardio",
  "full_body",
  "other",
];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMuscleGroup(
  value: unknown,
): value is MuscleGroup {
  return (
    typeof value === "string" &&
    muscleGroups.includes(value as MuscleGroup)
  );
}

function isExerciseSetTarget(
  value: unknown,
): value is ExerciseSetTarget {
  if (!isRecord(value)) {
    return false;
  }

  const isValidWeight =
    value.targetWeightKg === null ||
    (
      typeof value.targetWeightKg === "number" &&
      Number.isFinite(value.targetWeightKg) &&
      value.targetWeightKg >= 0 &&
      value.targetWeightKg <= 1000
    );

  return (
    Number.isInteger(value.setNumber) &&
    Number.isInteger(value.targetReps) &&
    isValidWeight
  );
}

function isExercise(
  value: unknown,
): value is Exercise {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.muscleGroups) &&
    value.muscleGroups.every(isMuscleGroup) &&
    Array.isArray(value.sets) &&
    value.sets.every(isExerciseSetTarget) &&
    Number.isInteger(value.restSeconds) &&
    typeof value.notes === "string"
  );
}

function isRoutineDay(
  value: unknown,
): value is RoutineDay {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    Number.isInteger(value.dayNumber) &&
    typeof value.name === "string" &&
    Array.isArray(value.targetMuscleGroups) &&
    value.targetMuscleGroups.every(isMuscleGroup) &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isExercise)
  );
}

function isRoutine(
  value: unknown,
): value is Routine {
  if (!isRecord(value)) {
    return false;
  }

  const isValidGoal =
    value.goal === "muscle_gain" ||
    value.goal === "strength" ||
    value.goal === "weight_loss" ||
    value.goal === "general_fitness";

  const isValidExperienceLevel =
    value.experienceLevel === "beginner" ||
    value.experienceLevel === "intermediate" ||
    value.experienceLevel === "advanced";

  const isValidLocation =
    value.location === "gym" ||
    value.location === "home" ||
    value.location === "outdoors";

  return (
    typeof value.id === "string" &&
    typeof value.userId === "string" &&
    typeof value.name === "string" &&
    isValidGoal &&
    isValidExperienceLevel &&
    Number.isInteger(value.weeklyFrequency) &&
    Number.isInteger(value.sessionDurationMinutes) &&
    isValidLocation &&
    Array.isArray(value.days) &&
    value.days.every(isRoutineDay) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isRoutineResponse(
  data: unknown,
): data is RoutineResponse {
  return isRecord(data) && isRoutine(data.routine);
}

function isRoutineListResponse(
  data: unknown,
): data is RoutineListResponse {
  return (
    isRecord(data) &&
    Array.isArray(data.routines) &&
    data.routines.every(isRoutine)
  );
}

export async function getRoutines(): Promise<RoutineListResponse> {
  const data = await translatedRequest(
    "/api/routines",
    {
      method: "GET",
    },
    "routineListFailed",
  );

  if (!isRoutineListResponse(data)) {
    throw new ApiRequestError("invalidServerResponse");
  }

  return data;
}

export async function getRoutineById(
  routineId: string,
): Promise<RoutineResponse> {
  const data = await translatedRequest(
    `/api/routines/${encodeURIComponent(routineId)}`,
    {
      method: "GET",
    },
    "routineLoadFailed",
  );

  if (!isRoutineResponse(data)) {
    throw new ApiRequestError("invalidServerResponse");
  }

  return data;
}

export async function createRoutine(
  routineData: CreateRoutineRequest,
): Promise<RoutineResponse> {
  const data = await translatedRequest(
    "/api/routines",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(routineData),
    },
    "routineCreateFailed",
  );

  if (!isRoutineResponse(data)) {
    throw new ApiRequestError("invalidServerResponse");
  }

  return data;
}

export async function updateRoutine(
  routineId: string,
  routineData: UpdateRoutineRequest,
): Promise<RoutineResponse> {
  const data = await translatedRequest(
    `/api/routines/${encodeURIComponent(routineId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(routineData),
    },
    "routineUpdateFailed",
  );

  if (!isRoutineResponse(data)) {
    throw new ApiRequestError("invalidServerResponse");
  }

  return data;
}

export async function deleteRoutine(
  routineId: string,
): Promise<void> {
  await translatedRequest(
    `/api/routines/${encodeURIComponent(routineId)}`,
    {
      method: "DELETE",
    },
    "routineDeleteFailed",
    "noContent",
  );
}