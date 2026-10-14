import type {
  GenerateRoutineRequest,
  GenerateRoutineResponse,
} from "../types/aiRoutine";
import {
  ApiRequestError,
  translatedRequest,
} from "./translatedRequest";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGenerateRoutineResponse(
  data: unknown,
): data is GenerateRoutineResponse {
  if (!isRecord(data) || !isRecord(data.routine)) {
    return false;
  }

  const routine = data.routine;

  return (
    typeof routine.name === "string" &&
    typeof routine.goal === "string" &&
    typeof routine.experienceLevel === "string" &&
    typeof routine.weeklyFrequency === "number" &&
    typeof routine.sessionDurationMinutes === "number" &&
    typeof routine.location === "string" &&
    Array.isArray(routine.days)
  );
}

export async function generateRoutine(
  requestData: GenerateRoutineRequest,
): Promise<GenerateRoutineResponse> {
  const data = await translatedRequest(
    "/api/ai/routines/generate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    },
    "aiRoutineGenerateFailed",
  );

  if (!isGenerateRoutineResponse(data)) {
    throw new ApiRequestError("invalidServerResponse");
  }

  return data;
}