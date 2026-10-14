import type { Request, Response } from "express";
import { Types } from "mongoose";
import type { HydratedDocument } from "mongoose";
import { Routine } from "../models/Routine.js";
import type { IRoutine } from "../models/Routine.js";
import type { AuthenticatedLocals } from "../middleware/requireAuth.js";
import {
  createRoutineSchema,
  updateRoutineSchema,
} from "../validators/routineValidator.js";


function serializeRoutine(
  routine: HydratedDocument<IRoutine>,
) {
  return {
    id: routine._id.toString(),
    userId: routine.userId.toString(),
    name: routine.name,
    goal: routine.goal,
    experienceLevel: routine.experienceLevel,
    weeklyFrequency: routine.weeklyFrequency,
    sessionDurationMinutes:
      routine.sessionDurationMinutes,
    location: routine.location,
    days: routine.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      name: day.name,
      targetMuscleGroups: day.targetMuscleGroups,
      exercises: day.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscleGroups: exercise.muscleGroups,
        sets: exercise.sets.map((set) => ({
          setNumber: set.setNumber,
          targetReps: set.targetReps,
          targetWeightKg: set.targetWeightKg ?? null,
        })),
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
      })),
    })),
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
  };
}

export async function createRoutine(
  request: Request<Record<string, never>, unknown, unknown>,
  response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
  const validationResult = createRoutineSchema.safeParse(
    request.body,
  );

  if (!validationResult.success) {
    return response.status(400).json({
      message: "루틴 입력값이 올바르지 않습니다.",
      errors: validationResult.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const routine = await Routine.create({
      userId: response.locals.userId,
      ...validationResult.data,
    });

    return response.status(201).json({
      routine: serializeRoutine(routine),
    });
  } catch (error) {
    console.error("Failed to create routine", error);

    return response.status(500).json({
      message: "루틴을 저장하는 중 서버 오류가 발생했습니다.",
    });
  }
}

export async function getRoutines(
  _request: Request,
  response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
  try {
    const routines = await Routine.find({
      userId: response.locals.userId,
    }).sort({
      createdAt: -1,
    });

    return response.status(200).json({
      routines: routines.map(serializeRoutine),
    });
  } catch (error) {
    console.error("Failed to get routines", error);

    return response.status(500).json({
      message: "루틴 목록을 불러오는 중 서버 오류가 발생했습니다.",
    });
  }
}


export async function getRoutineById(
  request: Request,
  response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
  const routineId = request.params.routineId;

  if (
    typeof routineId !== "string" ||
    !Types.ObjectId.isValid(routineId)
  ) {
    return response.status(404).json({
      message: "루틴을 찾을 수 없습니다.",
    });
  }


  try {
    const routine = await Routine.findOne({
      _id: routineId,
      userId: response.locals.userId,
    });

    if (!routine) {
      return response.status(404).json({
        message: "루틴을 찾을 수 없습니다.",
      });
    }

    return response.status(200).json({
      routine: serializeRoutine(routine),
    });
  } catch (error) {
    console.error("Failed to get routine", error);

    return response.status(500).json({
      message: "루틴을 불러오는 중 서버 오류가 발생했습니다.",
    });
  }
}

export async function updateRoutine(
  request: Request,
  response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
  const routineId = request.params.routineId;

  if (
    typeof routineId !== "string" ||
    !Types.ObjectId.isValid(routineId)
  ) {
    return response.status(404).json({
      message: "루틴을 찾을 수 없습니다.",
    });
  }

  const validationResult = updateRoutineSchema.safeParse(
    request.body,
  );

  if (!validationResult.success) {
    return response.status(400).json({
      message: "루틴 입력값이 올바르지 않습니다.",
      errors: validationResult.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const routine = await Routine.findOneAndUpdate(
      {
        _id: routineId,
        userId: response.locals.userId,
      },
      {
        $set: validationResult.data,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!routine) {
      return response.status(404).json({
        message: "루틴을 찾을 수 없습니다.",
      });
    }

    return response.status(200).json({
      routine: serializeRoutine(routine),
    });
  } catch (error) {
    console.error("Failed to update routine", error);

    return response.status(500).json({
      message: "루틴을 수정하는 중 서버 오류가 발생했습니다.",
    });
  }
}

export async function deleteRoutine(
  request: Request,
  response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
  const routineId = request.params.routineId;

  if (
    typeof routineId !== "string" ||
    !Types.ObjectId.isValid(routineId)
  ) {
    return response.status(404).json({
      message: "루틴을 찾을 수 없습니다.",
    });
  }

  try {
    const routine = await Routine.findOneAndDelete({
      _id: routineId,
      userId: response.locals.userId,
    });

    if (!routine) {
      return response.status(404).json({
        message: "루틴을 찾을 수 없습니다.",
      });
    }

    return response.status(204).send();
  } catch (error) {
    console.error("Failed to delete routine", error);

    return response.status(500).json({
      message: "루틴을 삭제하는 중 서버 오류가 발생했습니다.",
    });
  }
}