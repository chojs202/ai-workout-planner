import cors from "cors";
import express from "express";
import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { userRouter } from "./routes/userRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { routineRouter } from "./routes/routineRoutes.js";
import { aiRoutineRouter } from "./routes/aiRoutineRoutes.js";
import {
  workoutRouter,
} from "./routes/workoutRoutes.js";
import cookieParser from "cookie-parser";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
app.use(
  "/api/workouts",
  workoutRouter,
);

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use(
  (
    error: unknown,
    _request: Request,
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
      method: _request.method,
      path: _request.path,
    });

    response.status(status).json({
      message:
        status >= 500
          ? "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
          : "요청을 처리할 수 없습니다. 입력 내용을 확인해주세요.",
    });
  },
);
// 존재하지 않는 API에는 React 화면 대신 404를 반환합니다.
app.use("/api", (_request, response) => {
  response.status(404).json({
    code: "API_NOT_FOUND",
    message: "존재하지 않는 API입니다.",
  });
});

// 배포 환경에서 빌드된 React 화면을 제공합니다.
if (process.env.NODE_ENV === "production") {
  const clientDistPath = fileURLToPath(
    new URL("../../client/dist/", import.meta.url),
  );

  app.use(express.static(clientDistPath));

  // React 상세 페이지를 직접 열거나 새로고침할 때 처리합니다.
  app.get("/{*splat}", (request, response, next) => {
    // 없는 이미지·스크립트에는 HTML을 반환하지 않습니다.
    if (
      extname(request.path) !== "" ||
      !request.accepts("html")
    ) {
      response.status(404).end();
      return;
    }

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