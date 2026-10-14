import type {
  CreateExerciseInput,
  CreateRoutineDayInput,
  CreateRoutineRequest,
  Routine,
  UpdateRoutineRequest,
} from "./routine";

export interface RoutineFormExercise
  extends CreateExerciseInput {
  id?: string;
}

export interface RoutineFormDay
  extends Omit<CreateRoutineDayInput, "exercises"> {
  id?: string;
  exercises: RoutineFormExercise[];
}

export interface RoutineFormData
  extends Omit<CreateRoutineRequest, "days"> {
  days: RoutineFormDay[];
}

export function routineToFormData(
  routine: Routine,
): RoutineFormData {
  return {
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
        sets: exercise.sets,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
      })),
    })),
  };
}

export function formDataToCreateRequest(
  formData: RoutineFormData,
): CreateRoutineRequest {
  return {
    name: formData.name,
    goal: formData.goal,
    experienceLevel: formData.experienceLevel,
    weeklyFrequency: formData.weeklyFrequency,
    sessionDurationMinutes:
      formData.sessionDurationMinutes,
    location: formData.location,
    days: formData.days.map((day) => ({
      dayNumber: day.dayNumber,
      name: day.name,
      targetMuscleGroups: day.targetMuscleGroups,
      exercises: day.exercises.map((exercise) => ({
        name: exercise.name,
        muscleGroups: exercise.muscleGroups,
        sets: exercise.sets,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
      })),
    })),
  };
}

export function formDataToUpdateRequest(
  formData: RoutineFormData,
): UpdateRoutineRequest {
  return {
    name: formData.name,
    goal: formData.goal,
    experienceLevel: formData.experienceLevel,
    weeklyFrequency: formData.weeklyFrequency,
    sessionDurationMinutes:
      formData.sessionDurationMinutes,
    location: formData.location,
    days: formData.days.map((day) => ({
      id: day.id ?? crypto.randomUUID(),
      dayNumber: day.dayNumber,
      name: day.name,
      targetMuscleGroups: day.targetMuscleGroups,
      exercises: day.exercises.map((exercise) => ({
        id: exercise.id ?? crypto.randomUUID(),
        name: exercise.name,
        muscleGroups: exercise.muscleGroups,
        sets: exercise.sets,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
      })),
    })),
  };
}