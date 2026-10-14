import { randomUUID } from "node:crypto";
import {
  model,
  Schema,
  Types,
} from "mongoose";

export const routineGoals = [
  "muscle_gain",
  "strength",
  "weight_loss",
  "general_fitness",
] as const;

export const experienceLevels = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export const workoutLocations = [
  "gym",
  "home",
  "outdoors",
] as const;

export const muscleGroups = [
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
] as const;

export type RoutineGoal =
  (typeof routineGoals)[number];

export type ExperienceLevel =
  (typeof experienceLevels)[number];

export type WorkoutLocation =
  (typeof workoutLocations)[number];

export type MuscleGroup =
  (typeof muscleGroups)[number];

export interface IExerciseSetTarget {
  setNumber: number;
  targetReps: number;
  targetWeightKg: number | null;
}

export interface IExercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  sets: IExerciseSetTarget[];
  restSeconds: number;
  notes: string;
}

export interface IRoutineDay {
  id: string;
  dayNumber: number;
  name: string;
  targetMuscleGroups: MuscleGroup[];
  exercises: IExercise[];
}

export interface IRoutine {
  userId: Types.ObjectId;
  name: string;
  goal: RoutineGoal;
  experienceLevel: ExperienceLevel;
  weeklyFrequency: number;
  sessionDurationMinutes: number;
  location: WorkoutLocation;
  days: IRoutineDay[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateExerciseInput = Omit<
  IExercise,
  "id"
>;

export interface CreateRoutineDayInput
  extends Omit<IRoutineDay, "id" | "exercises"> {
  exercises: CreateExerciseInput[];
}

export interface CreateRoutineInput
  extends Omit<
    IRoutine,
    | "userId"
    | "days"
    | "createdAt"
    | "updatedAt"
  > {
  days: CreateRoutineDayInput[];
}

export type UpdateRoutineInput = Omit<
  IRoutine,
  "userId" | "createdAt" | "updatedAt"
>;

const exerciseSetTargetSchema =
  new Schema<IExerciseSetTarget>(
    {
      setNumber: {
        type: Number,
        required: true,
        min: 1,
        validate: {
          validator: Number.isInteger,
          message: "세트 번호는 정수여야 합니다.",
        },
      },
      targetReps: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
        validate: {
          validator: Number.isInteger,
          message: "목표 반복 횟수는 정수여야 합니다.",
        },
      },
      targetWeightKg: {
        type: Number,
        default: null,
        min: 0,
        max: 1000,
      },
    },
    {
      _id: false,
    },
  );

const exerciseSchema = new Schema<IExercise>(
  {
    id: {
      type: String,
      required: true,
      default: () => randomUUID(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    muscleGroups: {
      type: [String],
      required: true,
      enum: [...muscleGroups],
      validate: {
        validator: (value: MuscleGroup[]) =>
          value.length > 0,
        message: "운동 부위를 하나 이상 선택해야 합니다.",
      },
    },
    sets: {
      type: [exerciseSetTargetSchema],
      required: true,
      validate: {
        validator: (value: IExerciseSetTarget[]) =>
          value.length > 0,
        message: "운동 세트를 하나 이상 입력해야 합니다.",
      },
    },
    restSeconds: {
      type: Number,
      required: true,
      min: 0,
      max: 600,
      validate: {
        validator: Number.isInteger,
        message: "휴식 시간은 정수여야 합니다.",
      },
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    _id: false,
  },
);

const routineDaySchema = new Schema<IRoutineDay>(
  {
    id: {
      type: String,
      required: true,
      default: () => randomUUID(),
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
      validate: {
        validator: Number.isInteger,
        message: "운동일 번호는 정수여야 합니다.",
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    targetMuscleGroups: {
      type: [String],
      required: true,
      enum: [...muscleGroups],
      validate: {
        validator: (value: MuscleGroup[]) =>
          value.length > 0,
        message: "운동 부위를 하나 이상 선택해야 합니다.",
      },
    },
    exercises: {
      type: [exerciseSchema],
      required: true,
      validate: {
        validator: (value: IExercise[]) =>
          value.length > 0,
        message: "운동을 하나 이상 입력해야 합니다.",
      },
    },
  },
  {
    _id: false,
  },
);

const routineSchema = new Schema<IRoutine>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    goal: {
      type: String,
      required: true,
      enum: [...routineGoals],
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: [...experienceLevels],
    },
    weeklyFrequency: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
      validate: {
        validator: Number.isInteger,
        message: "주당 운동 횟수는 정수여야 합니다.",
      },
    },
    sessionDurationMinutes: {
      type: Number,
      required: true,
      min: 10,
      max: 240,
      validate: {
        validator: Number.isInteger,
        message: "운동 시간은 정수여야 합니다.",
      },
    },
    location: {
      type: String,
      required: true,
      enum: [...workoutLocations],
    },
    days: {
      type: [routineDaySchema],
      required: true,
      validate: {
        validator: (value: IRoutineDay[]) =>
          value.length > 0,
        message: "운동일을 하나 이상 입력해야 합니다.",
      },
    },
  },
  {
    timestamps: true,
  },
);

routineSchema.index({
  userId: 1,
  createdAt: -1,
});

export const Routine = model<IRoutine>(
  "Routine",
  routineSchema,
);