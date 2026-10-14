import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  signupRateLimiter,
} from "../middleware/rateLimiters.js";
import {
  changePassword,
  createUser,
  updateUserName,
  updateUserProfile,
  deleteUserAccount,
} from "../controllers/userController.js";

export const userRouter = Router();

userRouter.post(
  "/",
  signupRateLimiter,
  createUser,
);

userRouter.patch(
  "/me",
  requireAuth,
  changePassword,
);

userRouter.patch(
  "/me/name",
  requireAuth,
  updateUserName,
);

userRouter.patch(
  "/me/profile",
  requireAuth,
  updateUserProfile,
);

userRouter.delete(
  "/me",
  requireAuth,
  deleteUserAccount,
);