export type RoutineGoal =
  | "muscle_gain"
  | "strength"
  | "weight_loss"
  | "general_fitness";

export type ExperienceLevel =
  | "beginner"
  | "intermediate"
  | "advanced";

export type WorkoutLocation =
  | "gym"
  | "home"
  | "outdoors";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "cardio"
  | "full_body"
  | "other";

export interface ExerciseSetTarget {
  setNumber: number;
  targetReps: number;
  targetWeightKg: number | null;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  sets: ExerciseSetTarget[];
  restSeconds: number;
  notes: string;
}

export interface RoutineDay {
  id: string;
  dayNumber: number;
  name: string;
  targetMuscleGroups: MuscleGroup[];
  exercises: Exercise[];
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  goal: RoutineGoal;
  experienceLevel: ExperienceLevel;
  weeklyFrequency: number;
  sessionDurationMinutes: number;
  location: WorkoutLocation;
  days: RoutineDay[];
  createdAt: string;
  updatedAt: string;
}

export type CreateExerciseInput = Omit<Exercise, "id">;

export interface CreateRoutineDayInput
  extends Omit<RoutineDay, "id" | "exercises"> {
  exercises: CreateExerciseInput[];
}

export interface CreateRoutineRequest
  extends Omit<
    Routine,
    | "id"
    | "userId"
    | "days"
    | "createdAt"
    | "updatedAt"
  > {
  days: CreateRoutineDayInput[];
}

export type UpdateRoutineRequest = Omit<
  Routine,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export interface RoutineResponse {
  routine: Routine;
}

export interface RoutineListResponse {
  routines: Routine[];
}

export interface RoutineValidationError {
  path: string;
  message: string;
}

export interface RoutineErrorResponse {
  message: string;
  errors?: RoutineValidationError[];
}