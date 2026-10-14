import type {
    Request,
    Response,
} from "express";
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import type {
    AuthenticatedLocals,
} from "../middleware/requireAuth.js";
import {
    Routine,
} from "../models/Routine.js";
import {
    Workout,
} from "../models/Workout.js";
import {
    completeWorkout,
    deleteWorkout,
    deleteWorkoutExercise,
    getWorkoutById,
    getWorkouts,
    resetWorkoutSet,
    startWorkout,
    updateWorkoutSet,
} from "./workoutController.js";
vi.mock(
    "../models/Workout.js",
    () => ({
        Workout: {
            find: vi.fn(),
            findOne: vi.fn(),
            findOneAndDelete: vi.fn(),
        },
    }),
);
vi.mock(
    "../models/Routine.js",
    () => ({
        Routine: {
            findOne: vi.fn(),
        },
    }),
);

function createResponse(
    userId: string,
) {
    const status = vi.fn();
    const json = vi.fn();

    const response = {
        locals: {
            userId,
        },
        status,
        json,
    } as unknown as Response<
        unknown,
        AuthenticatedLocals
    >;

    status.mockReturnValue(response);
    json.mockReturnValue(response);

    return {
        response,
        status,
        json,
    };
}

describe("getWorkoutById 권한 확인", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("로그인한 사용자의 ID를 조회 조건에 포함한다", async () => {
        const workoutId =
            "507f1f77bcf86cd799439011";

        const userId =
            "507f191e810c19729de860ea";

        vi.mocked(
            Workout.findOne,
        ).mockReturnValue(
            Promise.resolve(null) as never,
        );

        const request = {
            params: {
                workoutId,
            },
        } as unknown as Request;

        const {
            response,
            status,
            json,
        } = createResponse(userId);

        await getWorkoutById(
            request,
            response,
        );

        expect(
            Workout.findOne,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(status).toHaveBeenCalledWith(
            404,
        );

        expect(json).toHaveBeenCalledWith({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });
});

describe("getWorkouts 권한 확인", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("로그인한 사용자의 완료 운동만 조회한다", async () => {
        const userId =
            "507f191e810c19729de860ea";

        const sort = vi.fn();

        sort.mockResolvedValue([]);

        vi.mocked(
            Workout.find,
        ).mockReturnValue({
            sort,
        } as never);

        const request = {
            query: {
                status: "completed",
            },
        } as unknown as Request;

        const {
            response,
            status,
            json,
        } = createResponse(userId);

        await getWorkouts(
            request,
            response,
        );

        expect(
            Workout.find,
        ).toHaveBeenCalledWith({
            userId,
            status: "completed",
        });

        expect(
            sort,
        ).toHaveBeenCalledWith({
            completedAt: -1,
            createdAt: -1,
        });

        expect(
            status,
        ).toHaveBeenCalledWith(200);

        expect(
            json,
        ).toHaveBeenCalledWith({
            workouts: [],
        });
    });
});
describe("deleteWorkout 권한 확인", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("로그인한 사용자의 ID를 삭제 조건에 포함한다", async () => {
        const workoutId =
            "507f1f77bcf86cd799439011";

        const userId =
            "507f191e810c19729de860ea";

        vi.mocked(
            Workout.findOneAndDelete,
        ).mockReturnValue(
            Promise.resolve(null) as never,
        );

        const request = {
            params: {
                workoutId,
            },
        } as unknown as Request;

        const {
            response,
            status,
            json,
        } = createResponse(userId);

        await deleteWorkout(
            request,
            response,
        );

        expect(
            Workout.findOneAndDelete,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(
            status,
        ).toHaveBeenCalledWith(404);

        expect(
            json,
        ).toHaveBeenCalledWith({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });
});
describe("updateWorkoutSet 권한 확인", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("로그인한 사용자의 ID를 세트 수정 조회 조건에 포함한다", async () => {
        const workoutId =
            "507f1f77bcf86cd799439011";

        const userId =
            "507f191e810c19729de860ea";

        vi.mocked(
            Workout.findOne,
        ).mockReturnValue(
            Promise.resolve(null) as never,
        );

        const request = {
            params: {
                workoutId,
            },
            body: {
                routineExerciseId:
                    "routine-exercise-1",
                setNumber: 1,
                actualReps: 10,
                actualWeightKg: 50,
                isCompleted: true,
            },
        } as unknown as Request;

        const {
            response,
            status,
            json,
        } = createResponse(userId);

        await updateWorkoutSet(
            request,
            response,
        );

        expect(
            Workout.findOne,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(
            status,
        ).toHaveBeenCalledWith(404);

        expect(
            json,
        ).toHaveBeenCalledWith({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });
});
describe("completeWorkout 권한 확인", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("로그인한 사용자의 ID를 운동 완료 조회 조건에 포함한다", async () => {
        const workoutId =
            "507f1f77bcf86cd799439011";

        const userId =
            "507f191e810c19729de860ea";

        vi.mocked(
            Workout.findOne,
        ).mockReturnValue(
            Promise.resolve(null) as never,
        );

        const request = {
            params: {
                workoutId,
            },
            body: {
                notes: "테스트 운동 메모",
            },
        } as unknown as Request;

        const {
            response,
            status,
            json,
        } = createResponse(userId);

        await completeWorkout(
            request,
            response,
        );

        expect(
            Workout.findOne,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(
            status,
        ).toHaveBeenCalledWith(404);

        expect(
            json,
        ).toHaveBeenCalledWith({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });
});
describe(
    "deleteWorkoutExercise 권한 확인",
    () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("로그인한 사용자의 ID를 운동 종목 삭제 조회 조건에 포함한다", async () => {
            const workoutId =
                "507f1f77bcf86cd799439011";

            const userId =
                "507f191e810c19729de860ea";

            const routineExerciseId =
                "routine-exercise-1";

            vi.mocked(
                Workout.findOne,
            ).mockReturnValue(
                Promise.resolve(null) as never,
            );

            const request = {
                params: {
                    workoutId,
                    routineExerciseId,
                },
            } as unknown as Request;

            const {
                response,
                status,
                json,
            } = createResponse(userId);

            await deleteWorkoutExercise(
                request,
                response,
            );

            expect(
                Workout.findOne,
            ).toHaveBeenCalledWith({
                _id: workoutId,
                userId,
            });

            expect(
                status,
            ).toHaveBeenCalledWith(404);

            expect(
                json,
            ).toHaveBeenCalledWith({
                message:
                    "운동 기록을 찾을 수 없습니다.",
            });
        });
    },
);
describe("resetWorkoutSet 권한 확인", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("로그인한 사용자의 ID를 세트 초기화 조회 조건에 포함한다", async () => {
        const workoutId =
            "507f1f77bcf86cd799439011";

        const userId =
            "507f191e810c19729de860ea";

        const routineExerciseId =
            "routine-exercise-1";

        vi.mocked(
            Workout.findOne,
        ).mockReturnValue(
            Promise.resolve(null) as never,
        );

        const request = {
            params: {
                workoutId,
                routineExerciseId,
                setNumber: "1",
            },
        } as unknown as Request;

        const {
            response,
            status,
            json,
        } = createResponse(userId);

        await resetWorkoutSet(
            request,
            response,
        );

        expect(
            Workout.findOne,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(
            status,
        ).toHaveBeenCalledWith(404);

        expect(
            json,
        ).toHaveBeenCalledWith({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });
});

describe("startWorkout 권한 확인", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("로그인한 사용자의 ID를 루틴 조회 조건에 포함한다", async () => {
        const routineId =
            "507f1f77bcf86cd799439011";

        const userId =
            "507f191e810c19729de860ea";

        const routineDayId =
            "123e4567-e89b-12d3-a456-426614174000";

        vi.mocked(
            Routine.findOne,
        ).mockReturnValue(
            Promise.resolve(null) as never,
        );

        const request = {
            body: {
                routineId,
                routineDayId,
                workoutDate: "2026-09-30",
            },
        } as unknown as Request<
            Record<string, never>,
            unknown,
            unknown
        >;

        const {
            response,
            status,
            json,
        } = createResponse(userId);

        await startWorkout(
            request,
            response,
        );

        expect(
            Routine.findOne,
        ).toHaveBeenCalledWith({
            _id: routineId,
            userId,
        });

        expect(
            status,
        ).toHaveBeenCalledWith(404);

        expect(
            json,
        ).toHaveBeenCalledWith({
            message:
                "루틴을 찾을 수 없습니다.",
        });
    });
});