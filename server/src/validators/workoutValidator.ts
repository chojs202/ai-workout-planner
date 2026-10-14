import { z } from "zod";
import { muscleGroups } from "../models/Routine.js";

function isValidWorkoutDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
const workoutDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "운동 날짜는 YYYY-MM-DD 형식이어야 합니다.")
  .refine(isValidWorkoutDate, "존재하지 않는 날짜입니다.");
export const startWorkoutSchema = z
  .object({
    routineId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "루틴 ID 형식이 올바르지 않습니다."),
    routineDayId: z.string().uuid("운동일 ID 형식이 올바르지 않습니다."),
    workoutDate: workoutDateSchema,
  })
  .strict();
export const updateWorkoutSetSchema = z
  .object({
    routineExerciseId: z
      .string()
      .min(1, "운동 ID가 필요합니다.")
      .max(100, "운동 ID가 너무 깁니다."),
    setNumber: z
      .number()
      .int("세트 번호는 정수여야 합니다.")
      .min(1, "세트 번호는 1 이상이어야 합니다."),
    actualReps: z
      .number()
      .int("실제 반복 횟수는 정수여야 합니다.")
      .min(0, "실제 반복 횟수는 0 이상이어야 합니다.")
      .max(1000, "실제 반복 횟수는 1000 이하여야 합니다.")
      .nullable(),
    actualWeightKg: z
      .number()
      .min(0, "실제 중량은 0 이상이어야 합니다.")
      .max(1000, "실제 중량은 1000kg 이하여야 합니다.")
      .nullable(),
    isCompleted: z.boolean(),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.isCompleted && data.actualReps === null) {
      context.addIssue({
        code: "custom",
        path: ["actualReps"],
        message: "완료한 세트에는 실제 반복 횟수가 필요합니다.",
      });
    }
  });
export const completeWorkoutSchema = z
  .object({
    notes: z
      .string()
      .trim()
      .max(1000, "운동 메모는 1000자 이하여야 합니다.")
      .optional(),
  })
  .strict();
const deletedWorkoutSetSchema = z
  .object({
    routineExerciseId: z
      .string()
      .min(1, "삭제할 운동 ID가 필요합니다.")
      .max(100, "삭제할 운동 ID가 너무 깁니다."),
    setNumber: z
      .number()
      .int("세트 번호는 정수여야 합니다.")
      .min(1, "세트 번호는 1 이상이어야 합니다."),
  })
  .strict();
const workoutExerciseUpdateSchema = z
  .object({
    routineExerciseId: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    muscleGroups: z.array(z.enum(muscleGroups)).min(1).max(muscleGroups.length),
    restSeconds: z.number().int().min(0).max(600),
    routineNotes: z.string().trim().max(500),
    notes: z.string().trim().max(500),
    sets: z
      .array(
        z
          .object({
            setNumber: z.number().int().min(1),
            targetReps: z.number().int().min(1).max(1000),
            targetWeightKg: z.number().min(0).max(1000).nullable(),
            actualReps: z.number().int().min(0).max(1000).nullable(),
            actualWeightKg: z.number().min(0).max(1000).nullable(),
            isCompleted: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine((data, context) => {
    if (new Set(data.muscleGroups).size !== data.muscleGroups.length) {
      context.addIssue({
        code: "custom",
        path: ["muscleGroups"],
        message: "운동 부위가 중복되어 있습니다.",
      });
    }
    const numbers = new Set<number>();
    data.sets.forEach((set, index) => {
      if (numbers.has(set.setNumber))
        context.addIssue({
          code: "custom",
          path: ["sets", index],
          message: "세트 번호가 중복되어 있습니다.",
        });
      numbers.add(set.setNumber);
    });
  });

export const updateCompletedWorkoutSchema = z
  .object({
    notes: z.string().trim().max(1000, "운동 메모는 1000자 이하여야 합니다."),
    sets: z
      .array(updateWorkoutSetSchema)
      .max(500, "한 번에 수정할 수 있는 세트가 너무 많습니다."),
    deletedExerciseIds: z
      .array(
        z
          .string()
          .min(1, "삭제할 운동 ID가 필요합니다.")
          .max(100, "삭제할 운동 ID가 너무 깁니다."),
      )
      .max(100, "한 번에 삭제할 수 있는 운동 종목이 너무 많습니다.")
      .default([]),
    exerciseUpdates: z.array(workoutExerciseUpdateSchema).max(100).optional(),
    workoutDate: workoutDateSchema.optional(),
    expectedUpdatedAt: z.string().datetime().optional(),
    deletedSets: z
      .array(deletedWorkoutSetSchema)
      .max(500, "한 번에 삭제할 수 있는 세트가 너무 많습니다.")
      .default([]),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.exerciseUpdates !== undefined) {
      if (data.sets.length || data.deletedSets.length) {
        context.addIssue({
          code: "custom",
          path: ["exerciseUpdates"],
          message: "종목 수정과 기존 세트 요청을 함께 보낼 수 없습니다.",
        });
      }
      if (!data.expectedUpdatedAt) {
        context.addIssue({
          code: "custom",
          path: ["expectedUpdatedAt"],
          message: "기록 버전이 필요합니다.",
        });
      }
      const ids = new Set<string>();
      data.exerciseUpdates.forEach((exercise, index) => {
        if (
          ids.has(exercise.routineExerciseId) ||
          data.deletedExerciseIds.includes(exercise.routineExerciseId)
        ) {
          context.addIssue({
            code: "custom",
            path: ["exerciseUpdates", index],
            message: "수정할 종목이 중복되거나 삭제 목록에 포함되어 있습니다.",
          });
        }
        ids.add(exercise.routineExerciseId);
      });
    } else if (!data.sets.length) {
      context.addIssue({
        code: "custom",
        path: ["sets"],
        message: "수정할 세트 기록이 하나 이상 필요합니다.",
      });
    }
    const keyOf = (set: { routineExerciseId: string; setNumber: number }) =>
      JSON.stringify([set.routineExerciseId, set.setNumber]);
    const setKeys = new Set<string>();
    data.sets.forEach((set, index) => {
      const key = keyOf(set);
      if (setKeys.has(key))
        context.addIssue({
          code: "custom",
          path: ["sets", index],
          message: "같은 운동 세트가 중복되어 있습니다.",
        });
      setKeys.add(key);
    });
    const deletedExerciseIds = new Set<string>();
    data.deletedExerciseIds.forEach((id, index) => {
      if (deletedExerciseIds.has(id))
        context.addIssue({
          code: "custom",
          path: ["deletedExerciseIds", index],
          message: "같은 운동 종목이 삭제 목록에 중복되어 있습니다.",
        });
      deletedExerciseIds.add(id);
    });
    const deletedKeys = new Set<string>();
    data.deletedSets.forEach((set, index) => {
      const key = keyOf(set);
      if (deletedKeys.has(key))
        context.addIssue({
          code: "custom",
          path: ["deletedSets", index],
          message: "같은 세트가 삭제 목록에 중복되어 있습니다.",
        });
      if (setKeys.has(key) || deletedExerciseIds.has(set.routineExerciseId))
        context.addIssue({
          code: "custom",
          path: ["deletedSets", index],
          message:
            "삭제할 세트는 수정 목록이나 삭제할 종목과 중복될 수 없습니다.",
        });
      deletedKeys.add(key);
    });
  });
export type StartWorkoutInput = z.infer<typeof startWorkoutSchema>;
export type UpdateWorkoutSetInput = z.infer<typeof updateWorkoutSetSchema>;
export type CompleteWorkoutInput = z.infer<typeof completeWorkoutSchema>;
export type UpdateCompletedWorkoutInput = z.infer<
  typeof updateCompletedWorkoutSchema
>;
