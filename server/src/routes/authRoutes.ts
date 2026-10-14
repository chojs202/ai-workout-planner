import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
} from "../controllers/authController.js";
import {
  requireAuth,
} from "../middleware/requireAuth.js";
import {
  loginRateLimiter,
  passwordResetRequestRateLimiter,
  passwordResetVerifyRateLimiter,
} from "../middleware/rateLimiters.js";
import {
  requestPasswordReset,
  verifyPasswordReset,
  resetPassword,
} from "../controllers/passwordResetController.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  loginRateLimiter,
  login,
);

authRouter.get(
  "/me",
  requireAuth,
  getCurrentUser,
);

authRouter.post(
  "/logout",
  logout,
);

authRouter.post(
  "/password-reset/request",
  passwordResetRequestRateLimiter,
  requestPasswordReset,
);

authRouter.post(
  "/password-reset/verify",
  passwordResetVerifyRateLimiter,
  verifyPasswordReset,
);

authRouter.post(
  "/password-reset/complete",
  passwordResetVerifyRateLimiter,
  resetPassword,
);