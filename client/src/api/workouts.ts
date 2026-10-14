import type {
  CompleteWorkoutRequest,
  DeleteWorkoutResponse,
  StartWorkoutRequest,
  UpdateCompletedWorkoutRequest,
  UpdateWorkoutSetRequest,
  WorkoutListResponse,
  WorkoutResponse,
} from "../types/workout";
import type { TranslationKey } from "../i18n/translations";
import {
  ApiRequestError,
  translatedRequest,
} from "./translatedRequest";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWorkoutResponse(
  data: unknown,
): data is WorkoutResponse {
  if (!isRecord(data) || !isRecord(data.workout)) {
    return false;
  }

  const workout = data.workout;

  return (
    typeof workout.id === "string" &&
    typeof workout.routineId === "string" &&
    typeof workout.routineName === "string" &&
    typeof workout.routineDayId === "string" &&
    typeof workout.routineDayName === "string" &&
    typeof workout.workoutDate === "string" &&
    (
      workout.status === "in_progress" ||
      workout.status === "completed"
    ) &&
    Array.isArray(workout.exercises)
  );
}

function isWorkoutListResponse(
  data: unknown,
): data is WorkoutListResponse {
  return (
    isRecord(data) &&
    Array.isArray(data.workouts)
  );
}

function isDeleteWorkoutResponse(
  data: unknown,
): data is DeleteWorkoutResponse {
  return (
    isRecord(data) &&
    typeof data.message === "string" &&
    typeof data.workoutId === "string"
  );
}

async function requestWorkout(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  fallbackKey: TranslationKey,
  requestData?: unknown,
): Promise<WorkoutResponse> {
  const data = await translatedRequest(
    path,
    {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body:
        requestData === undefined
          ? undefined
          : JSON.stringify(requestData),
    },
    fallbackKey,
  );

  if (!isWorkoutResponse(data)) {
    throw new ApiRequestError("invalidServerResponse");
  }

  return data;
}

export async function getWorkouts(
  status: "completed" | "in_progress" = "completed",
): Promise<WorkoutListResponse> {
  const data = await translatedRequest(
    `/api/workouts?status=${encodeURIComponent(status)}`,
    {
      method: "GET",
    },
    "workoutListFailed",
  );

  if (!isWorkoutListResponse(data)) {
    throw new ApiRequestError("invalidServerResponse");
  }

  return data;
}

export async function getWorkoutById(
  workoutId: string,
): Promise<WorkoutResponse> {
  return requestWorkout(
    `/api/workouts/${encodeURIComponent(workoutId)}`,
    "GET",
    "workoutLoadFailed",
  );
}

export async function startWorkout(
  requestData: StartWorkoutRequest,
): Promise<WorkoutResponse> {
  return requestWorkout(
    "/api/workouts",
    "POST",
    "workoutStartFailed",
    requestData,
  );
}

export async function updateWorkoutSet(
  workoutId: string,
  requestData: UpdateWorkoutSetRequest,
): Promise<WorkoutResponse> {
  return requestWorkout(
    `/api/workouts/${encodeURIComponent(workoutId)}/sets`,
    "PATCH",
    requestData.isCompleted === false
      ? "workoutSetUndoFailed"
      : "workoutSetSaveFailed",
    requestData,
  );
}

export async function updateCompletedWorkout(
  workoutId: string,
  requestData: UpdateCompletedWorkoutRequest,
): Promise<WorkoutResponse> {
  return requestWorkout(
    `/api/workouts/${encodeURIComponent(workoutId)}`,
    "PATCH",
    "workoutEditSaveFailed",
    requestData,
  );
}

export async function completeWorkout(
  workoutId: string,
  requestData: CompleteWorkoutRequest,
): Promise<WorkoutResponse> {
  return requestWorkout(
    `/api/workouts/${encodeURIComponent(workoutId)}/complete`,
    "POST",
    "workoutCompleteFailed",
    requestData,
  );
}

export async function deleteWorkoutExercise(
  workoutId: string,
  routineExerciseId: string,
): Promise<WorkoutResponse> {
  return requestWorkout(
    `/api/workouts/${encodeURIComponent(
      workoutId,
    )}/exercises/${encodeURIComponent(routineExerciseId)}`,
    "DELETE",
    "workoutEditSaveFailed",
  );
}

export async function resetWorkoutSet(
  workoutId: string,
  routineExerciseId: string,
  setNumber: number,
): Promise<WorkoutResponse> {
  return requestWorkout(
    `/api/workouts/${encodeURIComponent(
      workoutId,
    )}/exercises/${encodeURIComponent(
      routineExerciseId,
    )}/sets/${setNumber}`,
    "DELETE",
    "workoutEditSaveFailed",
  );
}

export async function deleteWorkout(
  workoutId: string,
): Promise<DeleteWorkoutResponse> {
  const data = await translatedRequest(
    `/api/workouts/${encodeURIComponent(workoutId)}`,
    {
      method: "DELETE",
    },
    "workoutDeleteFailed",
  );

  if (!isDeleteWorkoutResponse(data)) {
    throw new ApiRequestError("invalidServerResponse");
  }

  return data;
}