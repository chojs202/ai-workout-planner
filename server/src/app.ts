import cors from "cors";
import express from "express";
import type {
  NextFunction,
  Request,
  Response,
} from "express";
import cookieParser from "cookie-parser";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { userRouter } from "./routes/userRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { routineRouter } from "./routes/routineRoutes.js";
import { aiRoutineRouter } from "./routes/aiRoutineRoutes.js";
import { workoutRouter } from "./routes/workoutRoutes.js";

export const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/routines", routineRouter);
app.use("/api/ai/routines", aiRoutineRouter);
app.use("/api/workouts", workoutRouter);

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

// 존재하지 않는 API에는 JSON으로 404를 반환합니다.
app.use("/api", (_request, response) => {
  response.status(404).json({
    code: "API_NOT_FOUND",
    message: "존재하지 않는 API입니다.",
  });
});

if (process.env.NODE_ENV === "production") {
  const clientDistPath = fileURLToPath(
    new URL("../../client/dist/", import.meta.url),
  );

  // App.tsx에 등록된 화면 주소입니다.
  const pagePaths = [
    /^\/$/i,
    /^\/login\/?$/i,
    /^\/signup\/?$/i,
    /^\/logout\/?$/i,
    /^\/password-reset\/?$/i,
    /^\/dashboard\/?$/i,
    /^\/calendar\/?$/i,
    /^\/routines\/?$/i,
    /^\/routines\/new\/?$/i,
    /^\/routines\/ai\/?$/i,
    /^\/routines\/[^/]+\/edit\/?$/i,
    /^\/routines\/[^/]+\/?$/i,
    /^\/workouts\/?$/i,
    /^\/workouts\/[^/]+\/?$/i,
    /^\/profile\/?$/i,
    /^\/profile\/delete\/?$/i,
    /^\/about\/?$/i,
  ];

  app.use(
    express.static(clientDistPath, {
      index: false,
    }),
  );

  app.get("/{*splat}", (request, response, next) => {
    // 존재하지 않는 파일에는 React HTML을 반환하지 않습니다.
    if (
      extname(request.path) !== "" ||
      !request.accepts("html")
    ) {
      response.status(404).end();
      return;
    }

    const isKnownPage = pagePaths.some((pattern) =>
      pattern.test(request.path),
    );

    // 없는 주소에도 React를 실행하여 NotFoundPage를 표시합니다.
    response.status(isKnownPage ? 200 : 404);

    response.sendFile(
      join(clientDistPath, "index.html"),
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
      (error) => {
        if (error) {
          next(error);
        }
      },
    );
  });
}

// 모든 라우트와 정적 파일 처리 뒤에 배치합니다.
app.use(
  (
    error: unknown,
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    if (response.headersSent) {
      next(error);
      return;
    }

    const errorStatus =
      typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
        ? error.status
        : 500;

    const status =
      Number.isInteger(errorStatus) &&
        errorStatus >= 400 &&
        errorStatus <= 599
        ? errorStatus
        : 500;

    console.error("Request failed", {
      status,
      method: request.method,
      path: request.path,
    });

    response.status(status).json({
      message:
        status >= 500
          ? "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
          : "요청을 처리할 수 없습니다. 입력 내용을 확인해주세요.",
    });
  },
);