import { z } from "zod";
import {
  experienceLevels,
  muscleGroups,
  routineGoals,
  workoutLocations,
} from "../models/Routine.js";

const routineGoalSchema = z.enum(routineGoals);
const experienceLevelSchema = z.enum(experienceLevels);
const workoutLocationSchema = z.enum(workoutLocations);
const muscleGroupSchema = z.enum(muscleGroups);

export const generateRoutineRequestSchema = z.object({
  language: z.enum(["ko", "ja", "en"]),
  goal: routineGoalSchema,
  experienceLevel: experienceLevelSchema,
  weeklyFrequency: z.number().int().min(1).max(7),
  sessionDurationMinutes: z.number().int().min(10).max(240),
  location: workoutLocationSchema,

  focusMuscleGroups: z
    .array(muscleGroupSchema)
    .max(6),

  availableEquipment: z
    .array(
      z.string().trim().min(1).max(50),
    )
    .max(20),

  excludedExercises: z
    .array(
      z.string().trim().min(1).max(100),
    )
    .max(20),

  additionalNotes: z
    .string()
    .trim()
    .max(500),
});

const aiExerciseSetSchema = z.object({
  setNumber: z.number().int().min(1).max(10),

  targetReps: z.number().int().min(1).max(100),

  targetWeightKg: z
    .number()
    .min(0)
    .max(1000)
    .nullable()
    .describe(
      "사용자의 적절한 중량을 판단할 수 없으면 null",
    ),
});

const aiExerciseSchema = z.object({
  name: z.string().trim().min(1).max(100),

  muscleGroups: z
    .array(muscleGroupSchema)
    .min(1),

  sets: z
    .array(aiExerciseSetSchema)
    .min(1)
    .max(5),

  restSeconds: z
    .number()
    .int()
    .min(0)
    .max(600),

  notes: z.string().trim().max(500),
});

const aiRoutineDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(7),

  name: z.string().trim().min(1).max(100),

  targetMuscleGroups: z
    .array(muscleGroupSchema)
    .min(1),

  exercises: z
    .array(aiExerciseSchema)
    .min(1)
    .max(6),
});

export const aiGeneratedRoutineSchema = z.object({
  name: z.string().trim().min(1).max(100),

  goal: routineGoalSchema,

  experienceLevel: experienceLevelSchema,

  weeklyFrequency: z
    .number()
    .int()
    .min(1)
    .max(7),

  sessionDurationMinutes: z
    .number()
    .int()
    .min(10)
    .max(240),

  location: workoutLocationSchema,

  days: z
    .array(aiRoutineDaySchema)
    .min(1)
    .max(7),
});

export type GenerateRoutineRequest = z.infer<
  typeof generateRoutineRequestSchema
>;

export type AiGeneratedRoutine = z.infer<
  typeof aiGeneratedRoutineSchema
>;