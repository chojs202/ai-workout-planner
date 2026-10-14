import {
    describe,
    expect,
    it,
} from "vitest";
import type {
    Workout,
    WorkoutExercise,
    WorkoutSet,
} from "../types/workout";
import {
    getExerciseProgressList,
    getLatestWorkoutDate,
    getUniqueExerciseCount,
    getWorkoutPeriodSummary,
} from "./workoutProgress";

function createSet(
    setNumber: number,
    isCompleted: boolean,
): WorkoutSet {
    return {
        setNumber,
        targetReps: 10,
        targetWeightKg: 50,
        actualReps: isCompleted ? 10 : null,
        actualWeightKg: isCompleted ? 50 : null,
        isCompleted,
    };
}

function createExercise(
    routineExerciseId: string,
    name: string,
    completedSetCount: number,
    incompleteSetCount = 0,
): WorkoutExercise {
    const completedSets = Array.from(
        {
            length: completedSetCount,
        },
        (_, index) =>
            createSet(
                index + 1,
                true,
            ),
    );

    const incompleteSets = Array.from(
        {
            length: incompleteSetCount,
        },
        (_, index) =>
            createSet(
                completedSetCount +
                index +
                1,
                false,
            ),
    );

    return {
        routineExerciseId,
        name,
        muscleGroups: [],
        sets: [
            ...completedSets,
            ...incompleteSets,
        ],
        restSeconds: 60,
        routineNotes: "",
        notes: "",
    };
}

function createWorkout(
    id: string,
    exercises: WorkoutExercise[],
): Workout {
    return {
        id,
        userId: "user-1",
        routineId: "routine-1",
        routineName: "테스트 루틴",
        routineDayId: "routine-day-1",
        routineDayName: "테스트 운동일",
        workoutDate: "2026-09-29",
        status: "completed",
        exercises,
        startedAt:
            "2026-09-29T09:00:00.000Z",
        completedAt:
            "2026-09-29T10:00:00.000Z",
        notes: "",
        createdAt:
            "2026-09-29T09:00:00.000Z",
        updatedAt:
            "2026-09-29T10:00:00.000Z",
    };
}

describe("getUniqueExerciseCount", () => {
    it("운동 기록이 없으면 0을 반환한다", () => {
        expect(
            getUniqueExerciseCount([]),
        ).toBe(0);
    });

    it("완료한 세트가 있는 운동 종목만 계산한다", () => {
        const workouts = [
            createWorkout(
                "workout-1",
                [
                    createExercise(
                        "exercise-1",
                        "벤치프레스",
                        1,
                    ),
                    createExercise(
                        "exercise-2",
                        "푸시업",
                        1,
                    ),
                    createExercise(
                        "exercise-3",
                        "스쿼트",
                        0,
                        3,
                    ),
                ],
            ),
        ];

        expect(
            getUniqueExerciseCount(
                workouts,
            ),
        ).toBe(2);
    });

    it("같은 이름의 운동은 하나의 종목으로 계산한다", () => {
        const workouts = [
            createWorkout(
                "workout-1",
                [
                    createExercise(
                        "exercise-1",
                        " 벤치프레스 ",
                        1,
                    ),
                    createExercise(
                        "exercise-2",
                        "Push Up",
                        1,
                    ),
                ],
            ),
            createWorkout(
                "workout-2",
                [
                    createExercise(
                        "exercise-3",
                        "벤치프레스",
                        2,
                    ),
                    createExercise(
                        "exercise-4",
                        "push up",
                        1,
                    ),
                ],
            ),
        ];

        expect(
            getUniqueExerciseCount(
                workouts,
            ),
        ).toBe(2);
    });

    it("이름이 비어 있는 운동은 계산하지 않는다", () => {
        const workouts = [
            createWorkout(
                "workout-1",
                [
                    createExercise(
                        "exercise-1",
                        "   ",
                        1,
                    ),
                ],
            ),
        ];

        expect(
            getUniqueExerciseCount(
                workouts,
            ),
        ).toBe(0);
    });
});

describe("getLatestWorkoutDate", () => {
    it("운동 기록이 없으면 하이픈을 반환한다", () => {
        expect(
            getLatestWorkoutDate([]),
        ).toBe("-");
    });

    it("배열 순서와 관계없이 가장 최근 운동일을 반환한다", () => {
        const oldestWorkout = {
            ...createWorkout(
                "workout-1",
                [],
            ),
            workoutDate: "2026-09-10",
        };

        const latestWorkout = {
            ...createWorkout(
                "workout-2",
                [],
            ),
            workoutDate: "2026-09-29",
        };

        const middleWorkout = {
            ...createWorkout(
                "workout-3",
                [],
            ),
            workoutDate: "2026-09-20",
        };

        expect(
            getLatestWorkoutDate([
                middleWorkout,
                latestWorkout,
                oldestWorkout,
            ]),
        ).toBe("2026-09-29");
    });
});

describe("getWorkoutPeriodSummary", () => {
    const referenceDate =
        new Date(
            2026,
            8,
            29,
            12,
            0,
            0,
        );

    it("최근 7일과 30일의 시작 날짜를 포함해서 계산한다", () => {
        const exercise = createExercise(
            "exercise-1",
            "벤치프레스",
            1,
        );

        const workouts: Workout[] = [
            {
                ...createWorkout(
                    "workout-1",
                    [exercise],
                ),
                workoutDate: "2026-09-29",
            },
            {
                ...createWorkout(
                    "workout-2",
                    [exercise],
                ),
                workoutDate: "2026-09-23",
            },
            {
                ...createWorkout(
                    "workout-3",
                    [exercise],
                ),
                workoutDate: "2026-09-22",
            },
            {
                ...createWorkout(
                    "workout-4",
                    [exercise],
                ),
                workoutDate: "2026-08-31",
            },
            {
                ...createWorkout(
                    "workout-5",
                    [exercise],
                ),
                workoutDate: "2026-08-30",
            },
            {
                ...createWorkout(
                    "workout-6",
                    [exercise],
                ),
                workoutDate: "2026-09-30",
            },
        ];

        const result =
            getWorkoutPeriodSummary(
                workouts,
                referenceDate,
            );

        expect(
            result.last7DaysWorkoutCount,
        ).toBe(2);

        expect(
            result.last30DaysWorkoutCount,
        ).toBe(4);

        expect(
            result.last30DaysCompletedSetCount,
        ).toBe(4);

        expect(
            result.last30DaysVolumeKg,
        ).toBe(2000);
    });

    it("완료 세트는 계산하지만 중량과 반복 횟수가 모두 있어야 운동량에 포함한다", () => {
        const exercise: WorkoutExercise = {
            ...createExercise(
                "exercise-1",
                "벤치프레스",
                0,
            ),
            sets: [
                {
                    ...createSet(1, true),
                    actualReps: 10,
                    actualWeightKg: 50,
                },
                {
                    ...createSet(2, true),
                    actualReps: 12,
                    actualWeightKg: null,
                },
                {
                    ...createSet(3, true),
                    actualReps: null,
                    actualWeightKg: 60,
                },
                {
                    ...createSet(4, false),
                    actualReps: 8,
                    actualWeightKg: 100,
                },
            ],
        };

        const workout =
            createWorkout(
                "workout-1",
                [exercise],
            );

        const result =
            getWorkoutPeriodSummary(
                [workout],
                referenceDate,
            );

        expect(
            result.last30DaysWorkoutCount,
        ).toBe(1);

        expect(
            result.last30DaysCompletedSetCount,
        ).toBe(3);

        expect(
            result.last30DaysVolumeKg,
        ).toBe(500);
    });
});

describe("getExerciseProgressList", () => {
    it("서로 다른 운동 기록에서 2회 이상 완료한 종목만 반환한다", () => {
        const workouts: Workout[] = [
            createWorkout(
                "workout-1",
                [
                    createExercise(
                        "exercise-1",
                        " 벤치프레스 ",
                        1,
                    ),
                    createExercise(
                        "exercise-2",
                        "스쿼트",
                        1,
                    ),
                ],
            ),
            createWorkout(
                "workout-2",
                [
                    createExercise(
                        "exercise-3",
                        "벤치프레스",
                        1,
                    ),
                ],
            ),
        ];

        const result =
            getExerciseProgressList(
                workouts,
            );

        expect(result).toHaveLength(1);

        expect(result[0].key).toBe(
            "벤치프레스",
        );

        expect(result[0].name).toBe(
            "벤치프레스",
        );

        expect(
            result[0].records,
        ).toHaveLength(2);
    });

    it("최초·최근·최고 중량과 완료 세트의 운동량을 계산한다", () => {
        const firstExercise: WorkoutExercise = {
            ...createExercise(
                "exercise-1",
                "벤치프레스",
                0,
            ),
            sets: [
                {
                    ...createSet(1, true),
                    actualReps: 10,
                    actualWeightKg: 50,
                },
                {
                    ...createSet(2, true),
                    actualReps: 8,
                    actualWeightKg: 60,
                },
            ],
        };

        const latestExercise: WorkoutExercise = {
            ...createExercise(
                "exercise-2",
                "벤치프레스",
                0,
            ),
            sets: [
                {
                    ...createSet(1, true),
                    actualReps: 5,
                    actualWeightKg: 70,
                },
                {
                    ...createSet(2, true),
                    actualReps: 12,
                    actualWeightKg: null,
                },
                {
                    ...createSet(3, false),
                    actualReps: 1,
                    actualWeightKg: 100,
                },
            ],
        };

        const firstWorkout: Workout = {
            ...createWorkout(
                "workout-1",
                [firstExercise],
            ),
            workoutDate: "2026-09-01",
            completedAt:
                "2026-09-01T10:00:00.000Z",
        };

        const latestWorkout: Workout = {
            ...createWorkout(
                "workout-2",
                [latestExercise],
            ),
            workoutDate: "2026-09-29",
            completedAt:
                "2026-09-29T10:00:00.000Z",
        };

        const result =
            getExerciseProgressList([
                latestWorkout,
                firstWorkout,
            ]);

        expect(result).toHaveLength(1);

        const progress = result[0];

        expect(
            progress.firstWeightKg,
        ).toBe(60);

        expect(
            progress.latestWeightKg,
        ).toBe(70);

        expect(
            progress.bestWeightKg,
        ).toBe(70);

        expect(
            progress.weightChangeKg,
        ).toBe(10);

        expect(
            progress.records[0].workoutId,
        ).toBe("workout-2");

        expect(
            progress.records[1].workoutId,
        ).toBe("workout-1");

        expect(
            progress.records[0].completedSetCount,
        ).toBe(2);

        expect(
            progress.records[0].totalReps,
        ).toBe(17);

        expect(
            progress.records[0].volumeKg,
        ).toBe(350);

        expect(
            progress.records[1].completedSetCount,
        ).toBe(2);

        expect(
            progress.records[1].totalReps,
        ).toBe(18);

        expect(
            progress.records[1].volumeKg,
        ).toBe(980);
    });
});

describe(
    "getExerciseProgressList 예외 상황",
    () => {
        it("중량이 없는 완료 세트도 기록과 반복 횟수에는 포함한다", () => {
            const firstExercise: WorkoutExercise = {
                ...createExercise(
                    "exercise-1",
                    "푸시업",
                    0,
                ),
                sets: [
                    {
                        ...createSet(1, true),
                        actualReps: 10,
                        actualWeightKg: null,
                    },
                ],
            };

            const latestExercise: WorkoutExercise = {
                ...createExercise(
                    "exercise-2",
                    "푸시업",
                    0,
                ),
                sets: [
                    {
                        ...createSet(1, true),
                        actualReps: 12,
                        actualWeightKg: null,
                    },
                ],
            };

            const firstWorkout: Workout = {
                ...createWorkout(
                    "workout-1",
                    [firstExercise],
                ),
                workoutDate: "2026-09-01",
                completedAt:
                    "2026-09-01T10:00:00.000Z",
            };

            const latestWorkout: Workout = {
                ...createWorkout(
                    "workout-2",
                    [latestExercise],
                ),
                workoutDate: "2026-09-29",
                completedAt:
                    "2026-09-29T10:00:00.000Z",
            };

            const result =
                getExerciseProgressList([
                    firstWorkout,
                    latestWorkout,
                ]);

            expect(result).toHaveLength(1);

            const progress = result[0];

            expect(
                progress.firstWeightKg,
            ).toBeNull();

            expect(
                progress.latestWeightKg,
            ).toBeNull();

            expect(
                progress.bestWeightKg,
            ).toBeNull();

            expect(
                progress.weightChangeKg,
            ).toBeNull();

            expect(
                progress.records[0].workoutId,
            ).toBe("workout-2");

            expect(
                progress.records[0].completedSetCount,
            ).toBe(1);

            expect(
                progress.records[0].totalReps,
            ).toBe(12);

            expect(
                progress.records[0].maxWeightKg,
            ).toBeNull();

            expect(
                progress.records[0].volumeKg,
            ).toBe(0);
        });

        it("같은 날짜라면 완료 시간이 늦은 기록을 먼저 정렬한다", () => {
            const exercise =
                createExercise(
                    "exercise-1",
                    "벤치프레스",
                    1,
                );

            const earlierWorkout: Workout = {
                ...createWorkout(
                    "workout-1",
                    [exercise],
                ),
                workoutDate: "2026-09-29",
                completedAt:
                    "2026-09-29T10:00:00.000Z",
            };

            const laterWorkout: Workout = {
                ...createWorkout(
                    "workout-2",
                    [exercise],
                ),
                workoutDate: "2026-09-29",
                completedAt:
                    "2026-09-29T12:00:00.000Z",
            };

            const result =
                getExerciseProgressList([
                    earlierWorkout,
                    laterWorkout,
                ]);

            expect(result).toHaveLength(1);

            expect(
                result[0].records[0].workoutId,
            ).toBe("workout-2");

            expect(
                result[0].records[1].workoutId,
            ).toBe("workout-1");
        });
    },
);