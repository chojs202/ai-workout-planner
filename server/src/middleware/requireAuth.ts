import type {
  NextFunction,
  Request,
  Response,
} from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export interface AuthenticatedLocals {
  userId: string;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function requireAuth(
  request: Request,
  response: Response<unknown, AuthenticatedLocals>,
  next: NextFunction,
): Promise<Response<unknown, AuthenticatedLocals> | void> {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET 환경변수가 설정되지 않았습니다.");

    return response.status(500).json({
      message: "인증 처리 중 서버 오류가 발생했습니다.",
    });
  }

  const cookies: unknown = request.cookies;

  if (
    !isRecord(cookies) ||
    typeof cookies.auth_token !== "string"
  ) {
    return response.status(401).json({
      message: "로그인이 필요합니다.",
    });
  }

  try {
    const decodedToken: unknown = jwt.verify(
      cookies.auth_token,
      jwtSecret,
      {
        algorithms: ["HS256"],
      },
    );

    if (
      !isRecord(decodedToken) ||
      typeof decodedToken.sub !== "string" ||
      !/^[0-9a-fA-F]{24}$/.test(decodedToken.sub) ||
      typeof decodedToken.tokenVersion !== "number" ||
      !Number.isSafeInteger(decodedToken.tokenVersion) ||
      decodedToken.tokenVersion < 0
    ) {
      return response.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    const user = await User.findById(decodedToken.sub)
      .select("_id tokenVersion")
      .lean();

    if (
      !user ||
      (user.tokenVersion ?? 0) !== decodedToken.tokenVersion
    ) {
      return response.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    response.locals.userId = user._id.toString();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return response.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    console.error("사용자 인증 처리에 실패했습니다.");

    return response.status(500).json({
      message: "인증 처리 중 서버 오류가 발생했습니다.",
    });
  }

  next();
}