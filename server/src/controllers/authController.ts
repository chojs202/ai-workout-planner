import { compare } from "bcryptjs";
import type {
  Request,
  Response,
} from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import type {
  AuthenticatedLocals,
} from "../middleware/requireAuth.js";

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function login(
  request: Request<
    Record<string, never>,
    unknown,
    LoginBody
  >,
  response: Response,
): Promise<Response> {
  const {
    email,
    password,
  } = request.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.trim() === "" ||
    password === ""
  ) {
    return response.status(400).json({
      message:
        "이메일과 비밀번호를 입력해주세요.",
    });
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  if (normalizedEmail.length > 254) {
    return response.status(400).json({
      message:
        "이메일은 254자 이하여야 합니다.",
    });
  }

  const isValidEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail,
    );

  if (!isValidEmail) {
    return response.status(400).json({
      message:
        "올바른 이메일 형식이 아닙니다.",
    });
  }

  if (password.length < 8) {
    return response.status(400).json({
      message:
        "비밀번호는 8자 이상이어야 합니다.",
    });
  }

  if (password.length > 32) {
    return response.status(400).json({
      message:
        "비밀번호는 32자 이하여야 합니다.",
    });
  }

  const hasOnlyAllowedPasswordCharacters =
    /^[\x21-\x7E]+$/.test(password);

  if (!hasOnlyAllowedPasswordCharacters) {
    return response.status(400).json({
      message:
        "비밀번호는 영문, 숫자, 특수문자만 사용할 수 있습니다.",
    });
  }

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error(
      "JWT_SECRET 환경변수가 설정되지 않았습니다.",
    );

    return response.status(500).json({
      message:
        "로그인 중 서버 오류가 발생했습니다.",
    });
  }

  try {
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    if (!user) {
      return response.status(401).json({
        code: "LOGIN_EMAIL_NOT_FOUND",
        message: "가입되지 않은 이메일입니다.",
      });
    }

    const isPasswordCorrect =
      await compare(
        password,
        user.passwordHash,
      );

    if (!isPasswordCorrect) {
      return response.status(401).json({
        message:
          "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const token = jwt.sign(
      {
        tokenVersion: user.tokenVersion ?? 0,
      },
      jwtSecret,
      {
        subject: user._id.toString(),
        expiresIn: "1d",
        algorithm: "HS256",
      },
    );

    response.cookie(
      "auth_token",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        maxAge:
          24 * 60 * 60 * 1000,
        path: "/",
      },
    );

    return response.status(200).json({
      user: {
        id: user._id.toString(),
        name: user.name ?? "",
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Failed to login",
      error,
    );

    return response.status(500).json({
      message:
        "로그인 중 서버 오류가 발생했습니다.",
    });
  }
}

export async function getCurrentUser(
  _request: Request,
  response: Response<
    unknown,
    AuthenticatedLocals
  >,
): Promise<
  Response<
    unknown,
    AuthenticatedLocals
  >
> {
  try {
    const user =
      await User.findById(
        response.locals.userId,
      );

    if (!user) {
      return response.status(401).json({
        message:
          "로그인이 필요합니다.",
      });
    }

    return response.status(200).json({
      user: {
        id: user._id.toString(),
        name: user.name ?? "",
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Failed to get current user",
      error,
    );

    return response.status(500).json({
      message:
        "사용자 정보를 확인하는 중 서버 오류가 발생했습니다.",
    });
  }
}

export function logout(
  _request: Request,
  response: Response,
): Response {
  response.clearCookie(
    "auth_token",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
    },
  );

  return response.status(200).json({
    message:
      "로그아웃되었습니다.",
  });
}