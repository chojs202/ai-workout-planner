import type { Workout } from "../types/workout";
function normalizeExerciseName(exerciseName: string): string {
    return exerciseName.trim().toLowerCase();
}
export function getUniqueExerciseCount(workouts: Workout[]): number {
    const exerciseNames = new Set<string>();
    workouts.forEach((workout) => {
        workout.exercises.forEach((exercise) => {
            const normalizedName = normalizeExerciseName(exercise.name);
            const hasCompletedSet = exercise.sets.some((set) => set.isCompleted);
            if (normalizedName && hasCompletedSet) {
                exerciseNames.add(normalizedName);
            }
        });
    });
    return exerciseNames.size;
}
export function getLatestWorkoutDate(workouts: Workout[]): string {
    if (workouts.length === 0) {
        return "-";
    }
    return workouts.reduce(
        (latestDate, workout) =>
            workout.workoutDate > latestDate ? workout.workoutDate : latestDate,
        "",
    );
}
export interface WorkoutPeriodSummary {
    last7DaysWorkoutCount: number;
    last30DaysWorkoutCount: number;
    last30DaysCompletedSetCount: number;
    last30DaysVolumeKg: number;
}
function formatLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function createPastDateKey(referenceDate: Date, daysAgo: number): string {
    const date = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate() - daysAgo,
    );
    return formatLocalDateKey(date);
}
export function getWorkoutPeriodSummary(
    workouts: Workout[],
    referenceDate: Date = new Date(),
): WorkoutPeriodSummary {
    const todayDateKey = formatLocalDateKey(referenceDate);
    const last7DaysStartDateKey = createPastDateKey(referenceDate, 6);
    const last30DaysStartDateKey = createPastDateKey(referenceDate, 29);
    let last7DaysWorkoutCount = 0;
    let last30DaysWorkoutCount = 0;
    let last30DaysCompletedSetCount = 0;
    let last30DaysVolumeKg = 0;
    workouts.forEach((workout) => {
        const isWithinLast7Days =
            workout.workoutDate >= last7DaysStartDateKey &&
            workout.workoutDate <= todayDateKey;
        const isWithinLast30Days =
            workout.workoutDate >= last30DaysStartDateKey &&
            workout.workoutDate <= todayDateKey;
        if (isWithinLast7Days) {
            last7DaysWorkoutCount += 1;
        }
        if (!isWithinLast30Days) {
            return;
        }
        last30DaysWorkoutCount += 1;
        workout.exercises.forEach((exercise) => {
            exercise.sets.forEach((set) => {
                if (!set.isCompleted) {
                    return;
                }
                last30DaysCompletedSetCount += 1;
                if (set.actualReps === null || set.actualWeightKg === null) {
                    return;
                }
                last30DaysVolumeKg += set.actualReps * set.actualWeightKg;
            });
        });
    });
    return {
        last7DaysWorkoutCount,
        last30DaysWorkoutCount,
        last30DaysCompletedSetCount,
        last30DaysVolumeKg,
    };
}
export interface ExerciseProgressRecord {
    workoutId: string;
    routineName: string;
    routineDayName: string;
    workoutDate: string;
    completedAt: string | null;
    completedSetCount: number;
    totalReps: number;
    maxWeightKg: number | null;
    volumeKg: number;
}
export interface ExerciseProgress {
    key: string;
    name: string;
    records: ExerciseProgressRecord[];
    firstWeightKg: number | null;
    latestWeightKg: number | null;
    bestWeightKg: number | null;
    weightChangeKg: number | null;
    firstTotalReps: number;
    latestTotalReps: number;
    bestTotalReps: number;
    totalRepsChange: number;
}
export function getExerciseProgressList(
    workouts: Workout[],
): ExerciseProgress[] {
    const progressMap = new Map<
        string,
        {
            name: string;
            records: ExerciseProgressRecord[];
        }
    >();
    workouts.forEach((workout) => {
        workout.exercises.forEach((exercise) => {
            const exerciseKey = normalizeExerciseName(exercise.name);
            if (!exerciseKey) {
                return;
            }
            const completedSets = exercise.sets.filter((set) => set.isCompleted);
            const performedSets = completedSets.filter(
                (set) => set.actualReps !== null,
            );
            if (performedSets.length === 0) {
                return;
            }
            const totalReps = performedSets.reduce(
                (total, set) => total + (set.actualReps ?? 0),
                0,
            );
            const recordedWeights = performedSets
                .map((set) => set.actualWeightKg)
                .filter((weight): weight is number => weight !== null);
            const maxWeightKg =
                recordedWeights.length > 0 ? Math.max(...recordedWeights) : null;
            const volumeKg = performedSets.reduce((total, set) => {
                if (set.actualWeightKg === null) {
                    return total;
                }
                return total + (set.actualReps ?? 0) * set.actualWeightKg;
            }, 0);
            const progressRecord: ExerciseProgressRecord = {
                workoutId: workout.id,
                routineName: workout.routineName,
                routineDayName: workout.routineDayName,
                workoutDate: workout.workoutDate,
                completedAt: workout.completedAt,
                completedSetCount: completedSets.length,
                totalReps,
                maxWeightKg,
                volumeKg,
            };
            const existingProgress = progressMap.get(exerciseKey);
            if (existingProgress) {
                const existingWorkoutRecord = existingProgress.records.find(
                    (record) => record.workoutId === workout.id,
                );
                if (existingWorkoutRecord) {
                    existingWorkoutRecord.completedSetCount +=
                        progressRecord.completedSetCount;
                    existingWorkoutRecord.totalReps += progressRecord.totalReps;
                    existingWorkoutRecord.volumeKg += progressRecord.volumeKg;
                    if (progressRecord.maxWeightKg !== null) {
                        existingWorkoutRecord.maxWeightKg =
                            existingWorkoutRecord.maxWeightKg === null
                                ? progressRecord.maxWeightKg
                                : Math.max(
                                    existingWorkoutRecord.maxWeightKg,
                                    progressRecord.maxWeightKg,
                                );
                    }
                    return;
                }
                existingProgress.records.push(progressRecord);
                return;
            }
            progressMap.set(exerciseKey, {
                name: exercise.name.trim(),
                records: [progressRecord],
            });
        });
    });
    return Array.from(progressMap.entries())
        .filter(([, progress]) => {
            const completedWorkoutIds = new Set(
                progress.records.map((record) => record.workoutId),
            );
            return completedWorkoutIds.size >= 2;
        })
        .map(([key, progress]) => {
            const sortedRecords = [...progress.records].sort((first, second) => {
                if (first.workoutDate !== second.workoutDate) {
                    return second.workoutDate.localeCompare(first.workoutDate);
                }
                return (second.completedAt ?? "").localeCompare(
                    first.completedAt ?? "",
                );
            });
            const weightRecords = sortedRecords.filter(
                (
                    record,
                ): record is ExerciseProgressRecord & {
                    maxWeightKg: number;
                } => record.maxWeightKg !== null,
            );
            const latestWeightKg = weightRecords[0]?.maxWeightKg ?? null;
            const firstWeightKg =
                weightRecords[weightRecords.length - 1]?.maxWeightKg ?? null;
            const bestWeightKg =
                weightRecords.length > 0
                    ? Math.max(...weightRecords.map((record) => record.maxWeightKg))
                    : null;
            const weightChangeKg =
                weightRecords.length >= 2 &&
                    firstWeightKg !== null &&
                    latestWeightKg !== null
                    ? latestWeightKg - firstWeightKg
                    : null;
            const latestTotalReps = sortedRecords[0].totalReps;
            const firstTotalReps = sortedRecords[sortedRecords.length - 1].totalReps;
            const bestTotalReps = Math.max(
                ...sortedRecords.map((record) => record.totalReps),
            );
            const totalRepsChange = latestTotalReps - firstTotalReps;
            return {
                key,
                name: progress.name,
                records: sortedRecords,
                firstWeightKg,
                latestWeightKg,
                bestWeightKg,
                weightChangeKg,
                firstTotalReps,
                latestTotalReps,
                bestTotalReps,
                totalRepsChange,
            };
        })
        .sort((first, second) => first.name.localeCompare(second.name, "ko"));
}
