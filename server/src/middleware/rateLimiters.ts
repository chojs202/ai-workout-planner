import {
  rateLimit,
} from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message:
      "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
});

export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "회원가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
});

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (
    _request,
    response,
  ) => {
    const userId: unknown =
      response.locals.userId;

    if (typeof userId === "string") {
      return `user:${userId}`;
    }

    return "unauthenticated";
  },
  message: {
    message:
      "AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
});

export const passwordResetRequestRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "비밀번호 재설정 메일 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
});

export const passwordResetVerifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message:
      "비밀번호 재설정 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
});