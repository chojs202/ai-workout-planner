import {
    model,
    Schema,
} from "mongoose";
import type { Types } from "mongoose";
import { muscleGroups } from "./Routine.js";
import type { MuscleGroup } from "./Routine.js";

export const workoutStatuses = [
    "in_progress",
    "completed",
] as const;

export type WorkoutStatus =
    (typeof workoutStatuses)[number];

export interface IWorkoutSet {
    setNumber: number;

    targetReps: number;
    targetWeightKg: number | null;

    actualReps: number | null;
    actualWeightKg: number | null;

    isCompleted: boolean;
}

export interface IWorkoutExercise {
    routineExerciseId: string;

    name: string;
    muscleGroups: MuscleGroup[];

    sets: IWorkoutSet[];

    restSeconds: number;

    routineNotes: string;
    notes: string;
}

export interface IWorkout {
    userId: Types.ObjectId;

    routineId: Types.ObjectId;
    routineName: string;

    routineDayId: string;
    routineDayName: string;

    workoutDate: string;
    status: WorkoutStatus;

    exercises: IWorkoutExercise[];

    startedAt: Date;
    completedAt: Date | null;

    notes: string;

    createdAt: Date;
    updatedAt: Date;
}

const workoutSetSchema =
    new Schema<IWorkoutSet>(
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
                max: 1000,
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

            actualReps: {
                type: Number,
                default: null,
                min: 0,
                max: 1000,
                validate: {
                    validator: (
                        value: number | null,
                    ) =>
                        value === null ||
                        Number.isInteger(value),
                    message: "실제 반복 횟수는 정수여야 합니다.",
                },
            },

            actualWeightKg: {
                type: Number,
                default: null,
                min: 0,
                max: 1000,
            },

            isCompleted: {
                type: Boolean,
                required: true,
                default: false,
            },
        },
        {
            _id: false,
        },
    );

const workoutExerciseSchema =
    new Schema<IWorkoutExercise>(
        {
            routineExerciseId: {
                type: String,
                required: true,
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
                    validator: (
                        value: MuscleGroup[],
                    ) => value.length > 0,
                    message:
                        "운동 부위가 하나 이상 필요합니다.",
                },
            },

            sets: {
                type: [workoutSetSchema],
                required: true,
                validate: {
                    validator: (
                        value: IWorkoutSet[],
                    ) => value.length > 0,
                    message:
                        "운동 세트가 하나 이상 필요합니다.",
                },
            },

            restSeconds: {
                type: Number,
                required: true,
                min: 0,
                max: 600,
                validate: {
                    validator: Number.isInteger,
                    message:
                        "휴식 시간은 정수여야 합니다.",
                },
            },

            routineNotes: {
                type: String,
                default: "",
                trim: true,
                maxlength: 500,
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

const workoutSchema = new Schema<IWorkout>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },

        routineId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Routine",
        },

        routineName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        routineDayId: {
            type: String,
            required: true,
        },

        routineDayName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        workoutDate: {
            type: String,
            required: true,
            validate: {
                validator: (
                    value: string,
                ) => /^\d{4}-\d{2}-\d{2}$/.test(
                    value,
                ),
                message:
                    "운동 날짜 형식이 올바르지 않습니다.",
            },
        },

        status: {
            type: String,
            required: true,
            enum: [...workoutStatuses],
            default: "in_progress",
        },

        exercises: {
            type: [workoutExerciseSchema],
            required: true,
            validate: {
                validator: (
                    value: IWorkoutExercise[],
                ) => value.length > 0,
                message:
                    "운동 종목이 하나 이상 필요합니다.",
            },
        },

        startedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        notes: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    },
);

workoutSchema.index({
    userId: 1,
    workoutDate: -1,
});

workoutSchema.index({
    userId: 1,
    status: 1,
});

export const Workout = model<IWorkout>(
    "Workout",
    workoutSchema,
);