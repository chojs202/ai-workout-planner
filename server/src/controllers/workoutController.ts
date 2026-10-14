import type { Request, Response } from "express";
import { Types } from "mongoose";
import type { HydratedDocument } from "mongoose";
import type { AuthenticatedLocals } from "../middleware/requireAuth.js";
import { Routine } from "../models/Routine.js";
import { Workout } from "../models/Workout.js";
import type { IWorkout } from "../models/Workout.js";
import {
    completeWorkoutSchema,
    startWorkoutSchema,
    updateCompletedWorkoutSchema,
    updateWorkoutSetSchema,
} from "../validators/workoutValidator.js";
function serializeWorkout(workout: HydratedDocument<IWorkout>) {
    return {
        id: workout._id.toString(),
        userId: workout.userId.toString(),
        routineId: workout.routineId.toString(),
        routineName: workout.routineName,
        routineDayId: workout.routineDayId,
        routineDayName: workout.routineDayName,
        workoutDate: workout.workoutDate,
        status: workout.status,
        exercises: workout.exercises.map((exercise) => ({
            routineExerciseId: exercise.routineExerciseId,
            name: exercise.name,
            muscleGroups: exercise.muscleGroups,
            sets: exercise.sets.map((set) => ({
                setNumber: set.setNumber,
                targetReps: set.targetReps,
                targetWeightKg: set.targetWeightKg,
                actualReps: set.actualReps,
                actualWeightKg: set.actualWeightKg,
                isCompleted:
                    workout.status === "completed"
                        ? set.actualReps !== null && set.actualReps > 0
                        : set.isCompleted,
            })),
            restSeconds: exercise.restSeconds,
            routineNotes: exercise.routineNotes,
            notes: exercise.notes,
        })),
        startedAt: workout.startedAt.toISOString(),
        completedAt: workout.completedAt?.toISOString() ?? null,
        notes: workout.notes,
        createdAt: workout.createdAt.toISOString(),
        updatedAt: workout.updatedAt.toISOString(),
    };
}
export async function getWorkouts(
    request: Request,
    response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
    const requestedStatus = request.query.status;
    if (
        requestedStatus !== undefined &&
        requestedStatus !== "completed" &&
        requestedStatus !== "in_progress"
    ) {
        return response.status(400).json({
            message: "운동 기록 상태값이 올바르지 않습니다.",
        });
    }
    const status =
        requestedStatus === "in_progress" ? "in_progress" : "completed";
    try {
        const sortOptions: Record<string, 1 | -1> =
            status === "completed"
                ? {
                    completedAt: -1,
                    createdAt: -1,
                }
                : {
                    updatedAt: -1,
                    createdAt: -1,
                };
        const workouts = await Workout.find({
            userId: response.locals.userId,
            status,
        }).sort(sortOptions);
        return response.status(200).json({
            workouts: workouts.map((workout) => serializeWorkout(workout)),
        });
    } catch (error) {
        console.error("Failed to get workouts", error);
        return response.status(500).json({
            message: "운동 기록 목록을 불러오는 중 서버 오류가 발생했습니다.",
        });
    }
}
export async function startWorkout(
    request: Request<Record<string, never>, unknown, unknown>,
    response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
    const validationResult = startWorkoutSchema.safeParse(request.body);
    if (!validationResult.success) {
        return response.status(400).json({
            message: "운동 시작 요청값이 올바르지 않습니다.",
            errors: validationResult.error.issues.map((issue) => ({
                path: issue.path.map(String).join("."),
                message: issue.message,
            })),
        });
    }
    const { routineId, routineDayId, workoutDate } = validationResult.data;
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
        const routineDay = routine.days.find((day) => day.id === routineDayId);
        if (!routineDay) {
            return response.status(404).json({
                message: "루틴의 운동일을 찾을 수 없습니다.",
            });
        }
        const workout = await Workout.create({
            userId: response.locals.userId,
            routineId: routine._id,
            routineName: routine.name,
            routineDayId: routineDay.id,
            routineDayName: routineDay.name,
            workoutDate,
            status: "in_progress",
            exercises: routineDay.exercises.map((exercise) => ({
                routineExerciseId: exercise.id,
                name: exercise.name,
                muscleGroups: exercise.muscleGroups,
                sets: exercise.sets.map((set) => ({
                    setNumber: set.setNumber,
                    targetReps: set.targetReps,
                    targetWeightKg: set.targetWeightKg ?? null,
                    actualReps: null,
                    actualWeightKg: null,
                    isCompleted: false,
                })),
                restSeconds: exercise.restSeconds,
                routineNotes: exercise.notes,
                notes: "",
            })),
            startedAt: new Date(),
            completedAt: null,
            notes: "",
        });
        return response.status(201).json({
            workout: serializeWorkout(workout),
        });
    } catch (error) {
        console.error("Failed to start workout", error);
        return response.status(500).json({
            message: "운동을 시작하는 중 서버 오류가 발생했습니다.",
        });
    }
}
export async function updateWorkoutSet(
    request: Request,
    response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
    const workoutId = request.params.workoutId;
    if (typeof workoutId !== "string" || !Types.ObjectId.isValid(workoutId)) {
        return response.status(404).json({
            message: "운동 기록을 찾을 수 없습니다.",
        });
    }
    const validationResult = updateWorkoutSetSchema.safeParse(request.body);
    if (!validationResult.success) {
        return response.status(400).json({
            message: "세트 기록값이 올바르지 않습니다.",
            errors: validationResult.error.issues.map((issue) => ({
                path: issue.path.map(String).join("."),
                message: issue.message,
            })),
        });
    }
    const {
        routineExerciseId,
        setNumber,
        actualReps,
        actualWeightKg,
        isCompleted,
    } = validationResult.data;
    try {
        const workout = await Workout.findOne({
            _id: workoutId,
            userId: response.locals.userId,
        });
        if (!workout) {
            return response.status(404).json({
                message: "운동 기록을 찾을 수 없습니다.",
            });
        }
        const exercise = workout.exercises.find(
            (item) => item.routineExerciseId === routineExerciseId,
        );
        if (!exercise) {
            return response.status(404).json({
                message: "운동 종목을 찾을 수 없습니다.",
            });
        }
        const workoutSet = exercise.sets.find((set) => set.setNumber === setNumber);
        if (!workoutSet) {
            return response.status(404).json({
                message: "운동 세트를 찾을 수 없습니다.",
            });
        }
        workoutSet.actualReps = actualReps;
        workoutSet.actualWeightKg = actualWeightKg;
        workoutSet.isCompleted =
            workout.status === "completed"
                ? actualReps !== null && actualReps > 0
                : isCompleted;
        await workout.save();
        return response.status(200).json({
            workout: serializeWorkout(workout),
        });
    } catch (error) {
        console.error("Failed to update workout set", error);
        return response.status(500).json({
            message: "세트 기록을 저장하는 중 서버 오류가 발생했습니다.",
        });
    }
}
export async function completeWorkout(
    request: Request,
    response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
    const workoutId = request.params.workoutId;
    if (typeof workoutId !== "string" || !Types.ObjectId.isValid(workoutId)) {
        return response.status(404).json({
            message: "운동 기록을 찾을 수 없습니다.",
        });
    }
    const validationResult = completeWorkoutSchema.safeParse(request.body);
    if (!validationResult.success) {
        return response.status(400).json({
            message: "운동 완료 요청값이 올바르지 않습니다.",
            errors: validationResult.error.issues.map((issue) => ({
                path: issue.path.map(String).join("."),
                message: issue.message,
            })),
        });
    }
    try {
        const workout = await Workout.findOne({
            _id: workoutId,
            userId: response.locals.userId,
        });
        if (!workout) {
            return response.status(404).json({
                message: "운동 기록을 찾을 수 없습니다.",
            });
        }
        if (workout.status === "completed") {
            return response.status(200).json({
                workout: serializeWorkout(workout),
            });
        }
        workout.status = "completed";
        workout.completedAt = new Date();
        if (validationResult.data.notes !== undefined) {
            workout.notes = validationResult.data.notes;
        }
        await workout.save();
        return response.status(200).json({
            workout: serializeWorkout(workout),
        });
    } catch (error) {
        console.error("Failed to complete workout", error);
        return response.status(500).json({
            message: "운동을 완료하는 중 서버 오류가 발생했습니다.",
        });
    }
}
export async function updateCompletedWorkout(
    request: Request,
    response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
    const workoutId = request.params.workoutId;
    if (typeof workoutId !== "string" || !Types.ObjectId.isValid(workoutId)) {
        return response.status(404).json({
            message: "운동 기록을 찾을 수 없습니다.",
        });
    }
    const validationResult = updateCompletedWorkoutSchema.safeParse(request.body);
    if (!validationResult.success) {
        return response.status(400).json({
            message: "운동 기록 수정값이 올바르지 않습니다.",
            errors: validationResult.error.issues.map((issue) => ({
                path: issue.path.map(String).join("."),
                message: issue.message,
            })),
        });
    }
    try {
        const workout = await Workout.findOne({
            _id: workoutId,
            userId: response.locals.userId,
        });
        if (!workout) {
            return response.status(404).json({
                message: "운동 기록을 찾을 수 없습니다.",
            });
        }
        if (workout.status !== "completed") {
            return response.status(409).json({
                message: "완료된 운동 기록만 전체 수정할 수 있습니다.",
            });
        }
        // Apply exercise snapshots separately from the legacy set-only protocol.
        // Match the read version in the database so a concurrent edit cannot be overwritten.
        if (validationResult.data.exerciseUpdates !== undefined) {
            const input = validationResult.data;
            if (workout.updatedAt.toISOString() !== input.expectedUpdatedAt) {
                return response
                    .status(409)
                    .json({
                        message:
                            "기록이 변경되었습니다. 화면을 새로고침한 후 다시 수정해주세요.",
                    });
            }
            const deletedIds = new Set(input.deletedExerciseIds);
            const originalIds = new Set(
                workout.exercises.map((exercise) => exercise.routineExerciseId),
            );
            if (input.deletedExerciseIds.some((id) => !originalIds.has(id))) {
                return response
                    .status(400)
                    .json({ message: "삭제할 운동 종목 정보를 찾을 수 없습니다." });
            }
            // Newly recorded exercises get an independent UUID, never a routine mutation.
            if (
                input.exerciseUpdates!.some(
                    (exercise) =>
                        !originalIds.has(exercise.routineExerciseId) &&
                        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                            exercise.routineExerciseId,
                        ),
                )
            ) {
                return response
                    .status(400)
                    .json({ message: "추가할 운동 종목 ID 형식이 올바르지 않습니다." });
            }
            const updates = new Map(
                input.exerciseUpdates!.map((exercise) => [
                    exercise.routineExerciseId,
                    exercise,
                ]),
            );
            const exercises = workout.exercises
                .filter((exercise) => !deletedIds.has(exercise.routineExerciseId))
                .map(
                    (exercise) =>
                        updates.get(exercise.routineExerciseId) ?? {
                            routineExerciseId: exercise.routineExerciseId,
                            name: exercise.name,
                            muscleGroups: [...exercise.muscleGroups],
                            restSeconds: exercise.restSeconds,
                            routineNotes: exercise.routineNotes,
                            notes: exercise.notes,
                            sets: exercise.sets.map((set) => ({
                                setNumber: set.setNumber,
                                targetReps: set.targetReps,
                                targetWeightKg: set.targetWeightKg,
                                actualReps: set.actualReps,
                                actualWeightKg: set.actualWeightKg,
                                isCompleted: set.actualReps !== null && set.actualReps > 0,
                            })),
                        },
                );
            for (const exercise of input.exerciseUpdates!) {
                if (!originalIds.has(exercise.routineExerciseId))
                    exercises.push(exercise);
            }
            if (
                !exercises.length ||
                exercises.length > 100 ||
                exercises.reduce((count, exercise) => count + exercise.sets.length, 0) >
                500
            ) {
                return response
                    .status(400)
                    .json({ message: "운동 종목 또는 세트 수가 올바르지 않습니다." });
            }
            for (const exercise of exercises) {
                for (const set of exercise.sets)
                    set.isCompleted = set.actualReps !== null && set.actualReps > 0;
            }
            const saved = await Workout.findOneAndUpdate(
                {
                    _id: workoutId,
                    userId: response.locals.userId,
                    status: "completed",
                    updatedAt: workout.updatedAt,
                },
                {
                    $set: {
                        exercises,
                        notes: input.notes,
                        workoutDate: input.workoutDate ?? workout.workoutDate,
                    },
                },
                { new: true, runValidators: true },
            );
            if (!saved)
                return response
                    .status(409)
                    .json({
                        message:
                            "기록이 변경되었습니다. 화면을 새로고침한 후 다시 수정해주세요.",
                    });
            return response.status(200).json({ workout: serializeWorkout(saved) });
        }

        const deletedExerciseIds = new Set(
            validationResult.data.deletedExerciseIds,
        );
        for (const deletedExerciseId of deletedExerciseIds) {
            const exerciseExists = workout.exercises.some(
                (exercise) => exercise.routineExerciseId === deletedExerciseId,
            );
            if (!exerciseExists) {
                return response.status(400).json({
                    message: "삭제할 운동 종목 정보를 찾을 수 없습니다.",
                });
            }
        }
        const remainingExercises = workout.exercises.filter(
            (exercise) => !deletedExerciseIds.has(exercise.routineExerciseId),
        );
        if (remainingExercises.length === 0) {
            return response.status(409).json({
                message: "마지막 운동 종목은 삭제할 수 없습니다.",
            });
        }
        const deletedSetKeys = new Set(
            validationResult.data.deletedSets.map((set) =>
                JSON.stringify([set.routineExerciseId, set.setNumber]),
            ),
        );
        // Validate every deletion and the final shape before changing the document.
        for (const deletedSet of validationResult.data.deletedSets) {
            const exercise = remainingExercises.find(
                (item) => item.routineExerciseId === deletedSet.routineExerciseId,
            );
            if (
                !exercise?.sets.some((set) => set.setNumber === deletedSet.setNumber)
            ) {
                return response
                    .status(400)
                    .json({ message: "삭제할 운동 세트 정보를 찾을 수 없습니다." });
            }
        }
        for (const exercise of remainingExercises) {
            const remainingSets = exercise.sets.filter(
                (set) =>
                    !deletedSetKeys.has(
                        JSON.stringify([exercise.routineExerciseId, set.setNumber]),
                    ),
            );
            if (remainingSets.length === 0) {
                return response
                    .status(409)
                    .json({ message: "운동 종목마다 최소 한 세트는 남겨야 합니다." });
            }
        }
        const remainingSetCount = remainingExercises.reduce(
            (total, exercise) =>
                total +
                exercise.sets.filter(
                    (set) =>
                        !deletedSetKeys.has(
                            JSON.stringify([exercise.routineExerciseId, set.setNumber]),
                        ),
                ).length,
            0,
        );
        if (validationResult.data.sets.length !== remainingSetCount) {
            return response.status(400).json({
                message: "삭제하지 않은 모든 운동 세트의 기록이 필요합니다.",
            });
        }
        const requestedSets = new Map(
            validationResult.data.sets.map((set) => [
                JSON.stringify([set.routineExerciseId, set.setNumber]),
                set,
            ]),
        );
        for (const exercise of remainingExercises) {
            for (const workoutSet of exercise.sets) {
                const setKey = JSON.stringify([
                    exercise.routineExerciseId,
                    workoutSet.setNumber,
                ]);
                if (deletedSetKeys.has(setKey)) continue;
                const requestedSet = requestedSets.get(setKey);
                if (!requestedSet) {
                    return response.status(400).json({
                        message: "수정할 운동 세트 정보가 일치하지 않습니다.",
                    });
                }
            }
        }
        for (const exercise of remainingExercises) {
            for (const workoutSet of exercise.sets) {
                const setKey = JSON.stringify([
                    exercise.routineExerciseId,
                    workoutSet.setNumber,
                ]);
                if (deletedSetKeys.has(setKey)) continue;
                const requestedSet = requestedSets.get(setKey);
                if (!requestedSet) {
                    continue;
                }
                workoutSet.actualReps = requestedSet.actualReps;
                workoutSet.actualWeightKg = requestedSet.actualWeightKg;
                workoutSet.isCompleted =
                    requestedSet.actualReps !== null && requestedSet.actualReps > 0;
            }
        }
        for (let index = workout.exercises.length - 1; index >= 0; index -= 1) {
            const exercise = workout.exercises[index];
            if (exercise && deletedExerciseIds.has(exercise.routineExerciseId)) {
                workout.exercises.splice(index, 1);
            }
        }
        for (const exercise of remainingExercises) {
            for (let index = exercise.sets.length - 1; index >= 0; index -= 1) {
                const set = exercise.sets[index];
                if (
                    set &&
                    deletedSetKeys.has(
                        JSON.stringify([exercise.routineExerciseId, set.setNumber]),
                    )
                ) {
                    exercise.sets.splice(index, 1);
                }
            }
        }
        workout.notes = validationResult.data.notes;
        await workout.save();
        return response.status(200).json({
            workout: serializeWorkout(workout),
        });
    } catch (error) {
        console.error("Failed to update completed workout", error);
        return response.status(500).json({
            message: "완료된 운동 기록을 수정하는 중 서버 오류가 발생했습니다.",
        });
    }
}
export async function deleteWorkout(
    request: Request,
    response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
    const workoutId = request.params.workoutId;
    if (typeof workoutId !== "string" || !Types.ObjectId.isValid(workoutId)) {
        return response.status(404).json({
            message: "운동 기록을 찾을 수 없습니다.",
        });
    }
    try {
        const deletedWorkout = await Workout.findOneAndDelete({
            _id: workoutId,
            userId: response.locals.userId,
        });
        if (!deletedWorkout) {
            return response.status(404).json({
                message: "운동 기록을 찾을 수 없습니다.",
            });
        }
        return response.status(200).json({
            message: "운동 기록이 삭제되었습니다.",
            workoutId: deletedWorkout._id.toString(),
        });
    } catch (error) {
        console.error("Failed to delete workout", error);
        return response.status(500).json({
            message: "운동 기록을 삭제하는 중 서버 오류가 발생했습니다.",
        });
    }
}
export async function deleteWorkoutExercise(
    request: Request,
    response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
    const workoutId = request.params.workoutId;
    const routineExerciseId = request.params.routineExerciseId;
    if (
        typeof workoutId !== "string" ||
        !Types.ObjectId.isValid(workoutId) ||
        typeof routineExerciseId !== "string" ||
        routineExerciseId.length === 0
    ) {
        return response.status(404).json({
            message: "운동 기록을 찾을 수 없습니다.",
        });
    }
    try {
        const workout = await Workout.findOne({
            _id: workoutId,
            userId: response.locals.userId,
        });
        if (!workout) {
            return response.status(404).json({
                message: "운동 기록을 찾을 수 없습니다.",
            });
        }
        if (workout.status !== "in_progress") {
            return response.status(409).json({
                message: "완료된 운동의 종목은 개별적으로 삭제할 수 없습니다.",
            });
        }
        const exerciseIndex = workout.exercises.findIndex(
            (exercise) => exercise.routineExerciseId === routineExerciseId,
        );
        if (exerciseIndex === -1) {
            return response.status(404).json({
                message: "운동 종목을 찾을 수 없습니다.",
            });
        }
        if (workout.exercises.length === 1) {
            return response.status(409).json({
                message:
                    "마지막 운동 종목은 삭제할 수 없습니다. 운동 기록 전체를 삭제해주세요.",
            });
        }
        workout.exercises.splice(exerciseIndex, 1);
        await workout.save();
        return response.status(200).json({
            workout: serializeWorkout(workout),
        });
    } catch (error) {
        console.error("Failed to delete workout exercise", error);
        return response.status(500).json({
            message: "운동 종목을 삭제하는 중 서버 오류가 발생했습니다.",
        });
    }
}
export async function resetWorkoutSet(
    request: Request,
    response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
    const workoutId = request.params.workoutId;
    const routineExerciseId = request.params.routineExerciseId;
    const setNumberValue = request.params.setNumber;
    const setNumber = Number(setNumberValue);
    if (
        typeof workoutId !== "string" ||
        !Types.ObjectId.isValid(workoutId) ||
        typeof routineExerciseId !== "string" ||
        routineExerciseId.length === 0 ||
        typeof setNumberValue !== "string" ||
        !Number.isInteger(setNumber) ||
        setNumber < 1
    ) {
        return response.status(404).json({
            message: "운동 세트 기록을 찾을 수 없습니다.",
        });
    }
    try {
        const workout = await Workout.findOne({
            _id: workoutId,
            userId: response.locals.userId,
        });
        if (!workout) {
            return response.status(404).json({
                message: "운동 기록을 찾을 수 없습니다.",
            });
        }
        if (workout.status !== "in_progress") {
            return response.status(409).json({
                message: "완료된 운동의 세트는 개별적으로 초기화할 수 없습니다.",
            });
        }
        const exercise = workout.exercises.find(
            (item) => item.routineExerciseId === routineExerciseId,
        );
        if (!exercise) {
            return response.status(404).json({
                message: "운동 종목을 찾을 수 없습니다.",
            });
        }
        const workoutSet = exercise.sets.find((set) => set.setNumber === setNumber);
        if (!workoutSet) {
            return response.status(404).json({
                message: "운동 세트 기록을 찾을 수 없습니다.",
            });
        }
        workoutSet.actualReps = null;
        workoutSet.actualWeightKg = null;
        workoutSet.isCompleted = false;
        await workout.save();
        return response.status(200).json({
            workout: serializeWorkout(workout),
        });
    } catch (error) {
        console.error("Failed to reset workout set", error);
        return response.status(500).json({
            message: "운동 세트 기록을 삭제하는 중 서버 오류가 발생했습니다.",
        });
    }
}
export async function getWorkoutById(
    request: Request,
    response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
    const workoutId = request.params.workoutId;
    if (typeof workoutId !== "string" || !Types.ObjectId.isValid(workoutId)) {
        return response.status(404).json({
            message: "운동 기록을 찾을 수 없습니다.",
        });
    }
    try {
        const workout = await Workout.findOne({
            _id: workoutId,
            userId: response.locals.userId,
        });
        if (!workout) {
            return response.status(404).json({
                message: "운동 기록을 찾을 수 없습니다.",
            });
        }
        return response.status(200).json({
            workout: serializeWorkout(workout),
        });
    } catch (error) {
        console.error("Failed to get workout", error);
        return response.status(500).json({
            message: "운동 기록을 불러오는 중 서버 오류가 발생했습니다.",
        });
    }
}
