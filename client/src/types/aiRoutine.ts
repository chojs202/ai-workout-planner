import type {
  CreateRoutineRequest,
  ExperienceLevel,
  MuscleGroup,
  RoutineGoal,
  WorkoutLocation,
} from "./routine";

export interface GenerateRoutineRequest {
  language: "ko" | "ja" | "en";
  goal: RoutineGoal;
  experienceLevel: ExperienceLevel;
  weeklyFrequency: number;
  sessionDurationMinutes: number;
  location: WorkoutLocation;
  focusMuscleGroups: MuscleGroup[];
  availableEquipment: string[];
  excludedExercises: string[];
  additionalNotes: string;
}

export interface GenerateRoutineResponse {
  routine: CreateRoutineRequest;
}

export interface GenerateRoutineErrorDetail {
  path: string;
  message: string;
}

export interface GenerateRoutineErrorResponse {
  message: string;
  errors?: GenerateRoutineErrorDetail[];
}