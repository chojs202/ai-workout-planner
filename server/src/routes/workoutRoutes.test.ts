import request from "supertest";
import jwt from "jsonwebtoken";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { app } from "../app.js";

const workoutModelMocks = vi.hoisted(() => ({
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
}));

const routineModelMocks = vi.hoisted(() => ({
    findOne: vi.fn(),
}));

vi.mock("../models/Workout.js", () => ({
    Workout: {
        find: workoutModelMocks.find,
        findOne: workoutModelMocks.findOne,
        findOneAndDelete:
            workoutModelMocks.findOneAndDelete,
    },
}));

vi.mock(
    "../models/Routine.js",
    async (importOriginal) => {
        const actualModule =
            await importOriginal<
                typeof import("../models/Routine.js")
            >();

        return {
            ...actualModule,

            Routine: {
                findOne:
                    routineModelMocks.findOne,
            },
        };
    },
);

const jwtSecret = "workout-route-test-secret";

function createAuthToken(userId: string): string {
    return jwt.sign(
        {
            sub: userId,
        },
        jwtSecret,
    );
}

describe("workout routes 인증 및 권한", () => {
    beforeEach(() => {
        vi.stubEnv(
            "JWT_SECRET",
            jwtSecret,
        );

        workoutModelMocks.find.mockReset();
        workoutModelMocks.findOne.mockReset();
        workoutModelMocks.findOneAndDelete.mockReset();
        routineModelMocks.findOne.mockReset();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("로그인하지 않으면 운동 기록 목록을 조회할 수 없다", async () => {
        const response = await request(app)
            .get("/api/workouts")
            .expect(401);

        expect(response.body).toEqual({
            message: "로그인이 필요합니다.",
        });

        expect(
            workoutModelMocks.find,
        ).not.toHaveBeenCalled();
    });

    it("유효하지 않은 JWT로 운동 기록을 조회할 수 없다", async () => {
        const response = await request(app)
            .get("/api/workouts")
            .set(
                "Cookie",
                "auth_token=invalid-token",
            )
            .expect(401);

        expect(response.body).toEqual({
            message: "로그인이 필요합니다.",
        });

        expect(
            workoutModelMocks.find,
        ).not.toHaveBeenCalled();
    });

    it("로그인한 사용자는 자신의 완료된 운동 기록을 조회한다", async () => {
        const userId = "logged-in-user";
        const authToken =
            createAuthToken(userId);

        const sort = vi.fn().mockResolvedValue(
            [],
        );

        workoutModelMocks.find.mockReturnValue({
            sort,
        });

        const response = await request(app)
            .get(
                "/api/workouts?status=completed",
            )
            .set(
                "Cookie",
                `auth_token=${authToken}`,
            )
            .expect(200);

        expect(
            workoutModelMocks.find,
        ).toHaveBeenCalledWith({
            userId,
            status: "completed",
        });

        expect(response.body).toEqual({
            workouts: [],
        });
    });

    it("잘못된 형식의 운동 ID는 DB에서 조회하지 않는다", async () => {
        const authToken =
            createAuthToken("logged-in-user");

        const response = await request(app)
            .get(
                "/api/workouts/invalid-workout-id",
            )
            .set(
                "Cookie",
                `auth_token=${authToken}`,
            )
            .expect(404);

        expect(response.body).toEqual({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });

        expect(
            workoutModelMocks.findOne,
        ).not.toHaveBeenCalled();
    });

    it("다른 사용자의 운동 기록은 조회할 수 없다", async () => {
        const userId = "logged-in-user";
        const workoutId =
            "507f1f77bcf86cd799439011";
        const authToken =
            createAuthToken(userId);

        workoutModelMocks.findOne.mockResolvedValue(
            null,
        );

        const response = await request(app)
            .get(
                `/api/workouts/${workoutId}`,
            )
            .set(
                "Cookie",
                `auth_token=${authToken}`,
            )
            .expect(404);

        expect(
            workoutModelMocks.findOne,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(response.body).toEqual({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });

    it("다른 사용자의 운동 기록은 삭제할 수 없다", async () => {
        const userId = "logged-in-user";
        const workoutId =
            "507f1f77bcf86cd799439012";
        const authToken =
            createAuthToken(userId);

        workoutModelMocks.findOneAndDelete
            .mockResolvedValue(null);

        const response = await request(app)
            .delete(
                `/api/workouts/${workoutId}`,
            )
            .set(
                "Cookie",
                `auth_token=${authToken}`,
            )
            .expect(404);

        expect(
            workoutModelMocks.findOneAndDelete,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(response.body).toEqual({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });
    it("잘못된 운동 상태값으로 목록을 조회할 수 없다", async () => {
        const authToken =
            createAuthToken("logged-in-user");

        const response = await request(app)
            .get("/api/workouts?status=all")
            .set(
                "Cookie",
                `auth_token=${authToken}`,
            )
            .expect(400);

        expect(response.body).toEqual({
            message:
                "운동 기록 상태값이 올바르지 않습니다.",
        });

        expect(
            workoutModelMocks.find,
        ).not.toHaveBeenCalled();
    });

    it("다른 사용자의 세트 기록은 수정할 수 없다", async () => {
        const userId = "logged-in-user";
        const workoutId =
            "507f1f77bcf86cd799439013";
        const authToken =
            createAuthToken(userId);

        workoutModelMocks.findOne.mockResolvedValue(
            null,
        );

        const response = await request(app)
            .patch(
                `/api/workouts/${workoutId}/sets`,
            )
            .set(
                "Cookie",
                `auth_token=${authToken}`,
            )
            .send({
                routineExerciseId: "exercise-1",
                setNumber: 1,
                actualReps: 10,
                actualWeightKg: 50,
                isCompleted: true,
            })
            .expect(404);

        expect(
            workoutModelMocks.findOne,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(response.body).toEqual({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });

    it("다른 사용자의 운동을 완료 처리할 수 없다", async () => {
        const userId = "logged-in-user";
        const workoutId =
            "507f1f77bcf86cd799439014";
        const authToken =
            createAuthToken(userId);

        workoutModelMocks.findOne.mockResolvedValue(
            null,
        );

        const response = await request(app)
            .post(
                `/api/workouts/${workoutId}/complete`,
            )
            .set(
                "Cookie",
                `auth_token=${authToken}`,
            )
            .send({
                notes: "운동 완료 테스트",
            })
            .expect(404);

        expect(
            workoutModelMocks.findOne,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(response.body).toEqual({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });

    it("다른 사용자의 운동 종목은 삭제할 수 없다", async () => {
        const userId = "logged-in-user";
        const workoutId =
            "507f1f77bcf86cd799439015";
        const routineExerciseId = "exercise-1";
        const authToken =
            createAuthToken(userId);

        workoutModelMocks.findOne.mockResolvedValue(
            null,
        );

        const response = await request(app)
            .delete(
                `/api/workouts/${workoutId}/exercises/${routineExerciseId}`,
            )
            .set(
                "Cookie",
                `auth_token=${authToken}`,
            )
            .expect(404);

        expect(
            workoutModelMocks.findOne,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(response.body).toEqual({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });

    it("다른 사용자의 세트 기록은 초기화할 수 없다", async () => {
        const userId = "logged-in-user";
        const workoutId =
            "507f1f77bcf86cd799439016";
        const routineExerciseId = "exercise-1";
        const setNumber = 1;
        const authToken =
            createAuthToken(userId);

        workoutModelMocks.findOne.mockResolvedValue(
            null,
        );

        const response = await request(app)
            .delete(
                `/api/workouts/${workoutId}/exercises/${routineExerciseId}/sets/${setNumber}`,
            )
            .set(
                "Cookie",
                `auth_token=${authToken}`,
            )
            .expect(404);

        expect(
            workoutModelMocks.findOne,
        ).toHaveBeenCalledWith({
            _id: workoutId,
            userId,
        });

        expect(response.body).toEqual({
            message:
                "운동 기록을 찾을 수 없습니다.",
        });
    });
    it("다른 사용자의 루틴으로 운동을 시작할 수 없다", async () => {
    const userId = "logged-in-user";
    const routineId =
        "507f1f77bcf86cd799439021";
    const routineDayId =
        "550e8400-e29b-41d4-a716-446655440000";
    const authToken =
        createAuthToken(userId);

    routineModelMocks.findOne.mockResolvedValue(
        null,
    );

    const response = await request(app)
        .post("/api/workouts")
        .set(
            "Cookie",
            `auth_token=${authToken}`,
        )
        .send({
            routineId,
            routineDayId,
            workoutDate: "2026-10-01",
        })
        .expect(404);

    expect(
        routineModelMocks.findOne,
    ).toHaveBeenCalledWith({
        _id: routineId,
        userId,
    });

    expect(response.body).toEqual({
        message: "루틴을 찾을 수 없습니다.",
    });
});

it("잘못된 운동 시작 요청은 DB를 조회하지 않는다", async () => {
    const authToken =
        createAuthToken("logged-in-user");

    const response = await request(app)
        .post("/api/workouts")
        .set(
            "Cookie",
            `auth_token=${authToken}`,
        )
        .send({
            routineId: "invalid-id",
            routineDayId: "invalid-day-id",
            workoutDate: "2026-02-30",
        })
        .expect(400);

    expect(response.body).toMatchObject({
        message:
            "운동 시작 요청값이 올바르지 않습니다.",
    });

    expect(
        routineModelMocks.findOne,
    ).not.toHaveBeenCalled();
});

it("다른 사용자의 완료된 운동 기록은 전체 수정할 수 없다", async () => {
    const userId = "logged-in-user";
    const workoutId =
        "507f1f77bcf86cd799439022";
    const authToken =
        createAuthToken(userId);

    workoutModelMocks.findOne.mockResolvedValue(
        null,
    );

    const response = await request(app)
        .patch(
            `/api/workouts/${workoutId}`,
        )
        .set(
            "Cookie",
            `auth_token=${authToken}`,
        )
        .send({
            notes: "수정된 운동 메모",
            sets: [
                {
                    routineExerciseId:
                        "exercise-1",
                    setNumber: 1,
                    actualReps: 10,
                    actualWeightKg: 50,
                    isCompleted: true,
                },
            ],
            deletedExerciseIds: [],
        })
        .expect(404);

    expect(
        workoutModelMocks.findOne,
    ).toHaveBeenCalledWith({
        _id: workoutId,
        userId,
    });

    expect(response.body).toEqual({
        message:
            "운동 기록을 찾을 수 없습니다.",
    });
});

it("수정할 세트가 없는 완료 기록 수정 요청은 DB를 조회하지 않는다", async () => {
    const workoutId =
        "507f1f77bcf86cd799439023";
    const authToken =
        createAuthToken("logged-in-user");

    const response = await request(app)
        .patch(
            `/api/workouts/${workoutId}`,
        )
        .set(
            "Cookie",
            `auth_token=${authToken}`,
        )
        .send({
            notes: "",
            sets: [],
            deletedExerciseIds: [],
        })
        .expect(400);

    expect(response.body).toMatchObject({
        message:
            "운동 기록 수정값이 올바르지 않습니다.",
    });

    expect(
        workoutModelMocks.findOne,
    ).not.toHaveBeenCalled();
});

it("같은 세트가 중복된 완료 기록 수정 요청은 DB를 조회하지 않는다", async () => {
    const workoutId =
        "507f1f77bcf86cd799439024";
    const authToken =
        createAuthToken("logged-in-user");

    const duplicatedSet = {
        routineExerciseId: "exercise-1",
        setNumber: 1,
        actualReps: 10,
        actualWeightKg: 50,
        isCompleted: true,
    };

    const response = await request(app)
        .patch(
            `/api/workouts/${workoutId}`,
        )
        .set(
            "Cookie",
            `auth_token=${authToken}`,
        )
        .send({
            notes: "",
            sets: [
                duplicatedSet,
                duplicatedSet,
            ],
            deletedExerciseIds: [],
        })
        .expect(400);

    expect(response.body).toMatchObject({
        message:
            "운동 기록 수정값이 올바르지 않습니다.",
    });

    expect(
        workoutModelMocks.findOne,
    ).not.toHaveBeenCalled();
});
});