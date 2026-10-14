import { z } from "zod";
import {
  experienceLevels,
  muscleGroups,
  routineGoals,
  workoutLocations,
} from "../models/Routine.js";
import type {
  CreateRoutineInput,
  UpdateRoutineInput,
} from "../models/Routine.js";

const exerciseSetTargetSchema = z.strictObject({
  setNumber: z
    .number()
    .int("세트 번호는 정수여야 합니다.")
    .min(1, "세트 번호는 1 이상이어야 합니다."),

  targetReps: z
    .number()
    .int("목표 반복 횟수는 정수여야 합니다.")
    .min(1, "목표 반복 횟수는 1 이상이어야 합니다.")
    .max(100, "목표 반복 횟수는 100 이하여야 합니다."),
  targetWeightKg: z
    .number()
    .min(0, "목표 무게는 0kg 이상이어야 합니다.")
    .max(1000, "목표 무게는 1000kg 이하여야 합니다.")
    .nullable(),
});

const exerciseSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "운동 이름을 입력해주세요.")
    .max(100, "운동 이름은 100자 이하여야 합니다."),

  muscleGroups: z
    .array(z.enum(muscleGroups))
    .min(1, "운동 부위를 하나 이상 선택해야 합니다."),

  sets: z
    .array(exerciseSetTargetSchema)
    .min(1, "운동 세트를 하나 이상 입력해야 합니다."),

  restSeconds: z
    .number()
    .int("휴식 시간은 정수여야 합니다.")
    .min(0, "휴식 시간은 0초 이상이어야 합니다.")
    .max(600, "휴식 시간은 600초 이하여야 합니다."),

  notes: z
    .string()
    .trim()
    .max(500, "운동 메모는 500자 이하여야 합니다."),
});

const routineDaySchema = z.strictObject({
  dayNumber: z
    .number()
    .int("운동일 번호는 정수여야 합니다.")
    .min(1, "운동일 번호는 1 이상이어야 합니다.")
    .max(7, "운동일 번호는 7 이하여야 합니다."),

  name: z
    .string()
    .trim()
    .min(1, "운동일 이름을 입력해주세요.")
    .max(100, "운동일 이름은 100자 이하여야 합니다."),

  targetMuscleGroups: z
    .array(z.enum(muscleGroups))
    .min(1, "운동 부위를 하나 이상 선택해야 합니다."),

  exercises: z
    .array(exerciseSchema)
    .min(1, "운동을 하나 이상 입력해야 합니다."),
});

export const createRoutineSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "루틴 이름을 입력해주세요.")
    .max(100, "루틴 이름은 100자 이하여야 합니다."),

  goal: z.enum(routineGoals),

  experienceLevel: z.enum(experienceLevels),

  weeklyFrequency: z
    .number()
    .int("주당 운동 횟수는 정수여야 합니다.")
    .min(1, "주당 운동 횟수는 1회 이상이어야 합니다.")
    .max(7, "주당 운동 횟수는 7회 이하여야 합니다."),

  sessionDurationMinutes: z
    .number()
    .int("운동 시간은 정수여야 합니다.")
    .min(10, "운동 시간은 10분 이상이어야 합니다.")
    .max(240, "운동 시간은 240분 이하여야 합니다."),

  location: z.enum(workoutLocations),

  days: z
    .array(routineDaySchema)
    .min(1, "운동일을 하나 이상 입력해야 합니다."),
}) satisfies z.ZodType<CreateRoutineInput>;

const updateExerciseSchema = exerciseSchema.extend({
  id: z.uuid("운동 ID 형식이 올바르지 않습니다."),
});

const updateRoutineDaySchema = routineDaySchema
  .omit({
    exercises: true,
  })
  .extend({
    id: z.uuid("운동일 ID 형식이 올바르지 않습니다."),

    exercises: z
      .array(updateExerciseSchema)
      .min(1, "운동을 하나 이상 입력해야 합니다."),
  });

export const updateRoutineSchema = createRoutineSchema
  .omit({
    days: true,
  })
  .extend({
    days: z
      .array(updateRoutineDaySchema)
      .min(1, "운동일을 하나 이상 입력해야 합니다."),
  }) satisfies z.ZodType<UpdateRoutineInput>;