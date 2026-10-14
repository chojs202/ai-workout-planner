import express from "express";
import request from "supertest";
import {
  describe,
  expect,
  it,
} from "vitest";
import {
  aiRateLimiter,
  loginRateLimiter,
  signupRateLimiter,
} from "./rateLimiters.js";

describe("rate limiters", () => {
  it(
    "로그인 성공은 제외하고 실패 요청만 제한합니다.",
    async () => {
      const app = express();

      app.use(express.json());

      app.post(
        "/login",
        loginRateLimiter,
        (request, response) => {
          if (request.body.success === true) {
            response.status(200).json({
              message: "로그인 성공",
            });
            return;
          }

          response.status(401).json({
            message:
              "이메일 또는 비밀번호가 올바르지 않습니다.",
          });
        },
      );

      for (
        let attempt = 0;
        attempt < 12;
        attempt += 1
      ) {
        const successResponse = await request(app)
          .post("/login")
          .send({
            success: true,
          });

        expect(
          successResponse.status,
        ).toBe(200);
      }

      for (
        let attempt = 0;
        attempt < 10;
        attempt += 1
      ) {
        const failedResponse = await request(app)
          .post("/login")
          .send({
            success: false,
          });

        expect(
          failedResponse.status,
        ).toBe(401);
      }

      const limitedResponse = await request(app)
        .post("/login")
        .send({
          success: false,
        });

      expect(
        limitedResponse.status,
      ).toBe(429);

      expect(
        limitedResponse.body,
      ).toEqual({
        message:
          "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.",
      });

      expect(
        limitedResponse.headers.ratelimit,
      ).toBeDefined();

      expect(
        limitedResponse.headers[
          "x-ratelimit-limit"
        ],
      ).toBeUndefined();
    },
  );

  it(
    "회원가입 요청은 한 시간에 5회까지만 허용합니다.",
    async () => {
      const app = express();

      app.use(express.json());

      app.post(
        "/users",
        signupRateLimiter,
        (_request, response) => {
          response.status(201).json({
            message: "회원가입 성공",
          });
        },
      );

      for (
        let attempt = 0;
        attempt < 5;
        attempt += 1
      ) {
        const allowedResponse = await request(app)
          .post("/users")
          .send({});

        expect(
          allowedResponse.status,
        ).toBe(201);
      }

      const limitedResponse = await request(app)
        .post("/users")
        .send({});

      expect(
        limitedResponse.status,
      ).toBe(429);

      expect(
        limitedResponse.body,
      ).toEqual({
        message:
          "회원가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      });

      expect(
        limitedResponse.headers.ratelimit,
      ).toBeDefined();
    },
  );

  it(
    "AI 요청 제한을 로그인 사용자별로 구분합니다.",
    async () => {
      const app = express();

      app.use(express.json());

      app.post(
        "/ai",
        (
          request,
          response,
          next,
        ) => {
          const userId =
            request.header(
              "x-test-user-id",
            );

          if (!userId) {
            response.status(401).json({
              message: "로그인이 필요합니다.",
            });
            return;
          }

          response.locals.userId =
            userId;

          next();
        },
        aiRateLimiter,
        (_request, response) => {
          response.status(200).json({
            message: "AI 요청 성공",
          });
        },
      );

      const unauthorizedResponse =
        await request(app)
          .post("/ai")
          .send({});

      expect(
        unauthorizedResponse.status,
      ).toBe(401);

      for (
        let attempt = 0;
        attempt < 10;
        attempt += 1
      ) {
        const allowedResponse = await request(app)
          .post("/ai")
          .set(
            "x-test-user-id",
            "user-a",
          )
          .send({});

        expect(
          allowedResponse.status,
        ).toBe(200);
      }

      const limitedResponse = await request(app)
        .post("/ai")
        .set(
          "x-test-user-id",
          "user-a",
        )
        .send({});

      expect(
        limitedResponse.status,
      ).toBe(429);

      expect(
        limitedResponse.body,
      ).toEqual({
        message:
          "AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      });

      const otherUserResponse =
        await request(app)
          .post("/ai")
          .set(
            "x-test-user-id",
            "user-b",
          )
          .send({});

      expect(
        otherUserResponse.status,
      ).toBe(200);
    },
  );
});