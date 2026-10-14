import type {
    MuscleGroup,
} from "./routine";

export type WorkoutStatus =
    | "in_progress"
    | "completed";

export interface WorkoutSet {
    setNumber: number;

    targetReps: number;
    targetWeightKg: number | null;

    actualReps: number | null;
    actualWeightKg: number | null;

    isCompleted: boolean;
}

export interface WorkoutExercise {
    routineExerciseId: string;

    name: string;
    muscleGroups: MuscleGroup[];

    sets: WorkoutSet[];

    restSeconds: number;

    routineNotes: string;
    notes: string;
}

export interface Workout {
    id: string;
    userId: string;

    routineId: string;
    routineName: string;

    routineDayId: string;
    routineDayName: string;

    workoutDate: string;
    status: WorkoutStatus;

    exercises: WorkoutExercise[];

    startedAt: string;
    completedAt: string | null;

    notes: string;

    createdAt: string;
    updatedAt: string;
}

export interface StartWorkoutRequest {
    routineId: string;
    routineDayId: string;
    workoutDate: string;
}

export interface UpdateWorkoutSetRequest {
    routineExerciseId: string;
    setNumber: number;

    actualReps: number | null;
    actualWeightKg: number | null;

    isCompleted: boolean;
}

export interface UpdateCompletedWorkoutRequest {
    notes: string;
    sets: UpdateWorkoutSetRequest[];
    deletedExerciseIds: string[];
    deletedSets?: { routineExerciseId: string; setNumber: number }[];
    // Complete snapshots of only the exercises being changed or added.
    exerciseUpdates?: WorkoutExercise[];
    workoutDate?: string;
    expectedUpdatedAt?: string;
}

export interface CompleteWorkoutRequest {
    notes?: string;
}

export interface WorkoutResponse {
    workout: Workout;
}

export interface WorkoutListResponse {
    workouts: Workout[];
}

export interface DeleteWorkoutResponse {
    message: string;
    workoutId: string;
}

export interface WorkoutErrorDetail {
    path: string;
    message: string;
}

export interface WorkoutErrorResponse {
    message: string;
    errors?: WorkoutErrorDetail[];
}