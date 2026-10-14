import { compare, hash } from "bcryptjs";
import type {
  Request,
  Response,
} from "express";
import { User } from "../models/User.js";
import type {
  AuthenticatedLocals,
} from "../middleware/requireAuth.js";
import { Routine } from "../models/Routine.js";
import { Workout } from "../models/Workout.js";


interface CreateUserBody {
  email?: unknown;
  password?: unknown;
}

function isDuplicateKeyError(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function createUser(
  request: Request<
    Record<string, never>,
    unknown,
    CreateUserBody
  >,
  response: Response,
): Promise<Response> {
  const {
    email,
    password,
  } = request.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string"
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

  try {
    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return response.status(409).json({
        message:
          "이미 가입된 이메일입니다.",
      });
    }

    const passwordHash =
      await hash(password, 12);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
    });

    return response.status(201).json({
      user: {
        id: user._id.toString(),
        name: user.name ?? "",
        email: user.email,
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return response.status(409).json({
        message:
          "이미 가입된 이메일입니다.",
      });
    }

    console.error(
      "Failed to create user",
      error,
    );

    return response.status(500).json({
      message:
        "회원가입 중 서버 오류가 발생했습니다.",
    });
  }

}

export async function updateUserName(
  request: Request<
    Record<string, never>,
    unknown,
    unknown
  >,
  response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
  const body = request.body;

  if (
    typeof body !== "object" ||
    body === null ||
    !("name" in body) ||
    typeof body.name !== "string"
  ) {
    return response.status(400).json({
      message: "이름을 입력해주세요.",
    });
  }

  const name = body.name.trim();

  if (name.length === 0) {
    return response.status(400).json({
      message: "이름을 입력해주세요.",
    });
  }

  if (name.length > 30) {
    return response.status(400).json({
      message: "이름은 30자 이하여야 합니다.",
    });
  }

  if (/[\u0000-\u001F\u007F]/.test(name)) {
    return response.status(400).json({
      message: "이름에 줄바꿈이나 제어 문자를 사용할 수 없습니다.",
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      response.locals.userId,
      {
        $set: { name },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      return response.status(401).json({
        message: "로그인이 필요합니다.",
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
    console.error("Failed to update user name", error);

    return response.status(500).json({
      message: "이름 수정 중 서버 오류가 발생했습니다.",
    });
  }
}

export async function changePassword(
  request: Request<
    Record<string, never>,
    unknown,
    unknown
  >,
  response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
  const body = request.body;

  if (
    typeof body !== "object" ||
    body === null ||
    !("currentPassword" in body) ||
    !("newPassword" in body) ||
    typeof body.currentPassword !== "string" ||
    typeof body.newPassword !== "string"
  ) {
    return response.status(400).json({
      message: "현재 비밀번호와 새 비밀번호를 입력해주세요.",
    });
  }

  const { currentPassword, newPassword } = body;

  if (currentPassword === "" || newPassword === "") {
    return response.status(400).json({
      message: "현재 비밀번호와 새 비밀번호를 입력해주세요.",
    });
  }

  if (
    currentPassword.length < 8 ||
    currentPassword.length > 32 ||
    !/^[\x21-\x7E]+$/.test(currentPassword)
  ) {
    return response.status(400).json({
      message: "현재 비밀번호를 확인해주세요.",
    });
  }

  if (newPassword.length < 8) {
    return response.status(400).json({
      message: "새 비밀번호는 8자 이상이어야 합니다.",
    });
  }

  if (newPassword.length > 32) {
    return response.status(400).json({
      message: "새 비밀번호는 32자 이하여야 합니다.",
    });
  }

  if (!/^[\x21-\x7E]+$/.test(newPassword)) {
    return response.status(400).json({
      message:
        "새 비밀번호는 영문, 숫자, 특수문자만 사용할 수 있습니다.",
    });
  }

  try {
    const user = await User.findById(
      response.locals.userId,
    ).select("+passwordHash");

    if (!user) {
      return response.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    const isPasswordCorrect = await compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordCorrect) {
      return response.status(400).json({
        message: "현재 비밀번호가 올바르지 않습니다.",
      });
    }

    if (currentPassword === newPassword) {
      return response.status(400).json({
        message: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
      });
    }

    user.passwordHash = await hash(newPassword, 12);
    await user.save();

    return response.status(200).json({
      message: "비밀번호가 변경되었습니다.",
    });
  } catch (error) {
    console.error("Failed to change password", error);

    return response.status(500).json({
      message: "비밀번호 변경 중 서버 오류가 발생했습니다.",
    });
  }
}
export async function updateUserProfile(
  request: Request<Record<string, never>, unknown, unknown>,
  response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
  const body = request.body;

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return response.status(400).json({
      message: "회원정보 수정 요청이 올바르지 않습니다.",
    });
  }

  const data = body as Record<string, unknown>;

  const allowedKeys = [
    "name",
    "currentPassword",
    "newPassword",
  ];

  if (Object.keys(data).some((key) => !allowedKeys.includes(key))) {
    return response.status(400).json({
      message: "수정할 수 없는 항목이 포함되어 있습니다.",
    });
  }

  const hasName = Object.hasOwn(data, "name");
  const hasPassword =
    Object.hasOwn(data, "currentPassword") ||
    Object.hasOwn(data, "newPassword");

  if (!hasName && !hasPassword) {
    return response.status(400).json({
      message: "수정할 항목이 필요합니다.",
    });
  }

  let normalizedName: string | undefined;

  if (hasName) {
    if (typeof data.name !== "string") {
      return response.status(400).json({
        message: "이름을 입력해주세요.",
      });
    }

    normalizedName = data.name.trim();

    if (normalizedName.length === 0) {
      return response.status(400).json({
        message: "이름을 입력해주세요.",
      });
    }

    if (normalizedName.length > 30) {
      return response.status(400).json({
        message: "이름은 30자 이하여야 합니다.",
      });
    }

    if (/[\u0000-\u001F\u007F]/.test(normalizedName)) {
      return response.status(400).json({
        message: "이름에 줄바꿈이나 제어 문자를 사용할 수 없습니다.",
      });
    }
  }

  let currentPassword: string | undefined;
  let newPassword: string | undefined;

  if (hasPassword) {
    if (
      typeof data.currentPassword !== "string" ||
      typeof data.newPassword !== "string" ||
      data.currentPassword === "" ||
      data.newPassword === ""
    ) {
      return response.status(400).json({
        message: "현재 비밀번호와 새 비밀번호를 입력해주세요.",
      });
    }

    currentPassword = data.currentPassword;
    newPassword = data.newPassword;

    if (
      currentPassword.length < 8 ||
      currentPassword.length > 32 ||
      !/^[\x21-\x7E]+$/.test(currentPassword)
    ) {
      return response.status(400).json({
        message: "현재 비밀번호를 확인해주세요.",
      });
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 32 ||
      !/^[\x21-\x7E]+$/.test(newPassword)
    ) {
      return response.status(400).json({
        message:
          "새 비밀번호는 영문, 숫자, 특수문자로 8~32자여야 합니다.",
      });
    }

    if (currentPassword === newPassword) {
      return response.status(400).json({
        message: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
      });
    }
  }

  try {
    const user = await User.findById(
      response.locals.userId,
    ).select("+passwordHash");

    if (!user) {
      return response.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    const changes: {
      name?: string;
      passwordHash?: string;
    } = {};

    if (normalizedName !== undefined) {
      changes.name = normalizedName;
    }

    if (
      currentPassword !== undefined &&
      newPassword !== undefined
    ) {
      const isPasswordCorrect = await compare(
        currentPassword,
        user.passwordHash,
      );

      if (!isPasswordCorrect) {
        return response.status(400).json({
          message: "현재 비밀번호가 올바르지 않습니다.",
        });
      }

      changes.passwordHash = await hash(newPassword, 12);
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        passwordHash: user.passwordHash,
      },
      {
        $set: changes,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedUser) {
      return response.status(409).json({
        message:
          "계정 정보가 변경되었습니다. 새로고침 후 다시 시도해주세요.",
      });
    }

    return response.status(200).json({
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name ?? "",
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("Failed to update user profile", error);

    return response.status(500).json({
      message: "회원정보 수정 중 서버 오류가 발생했습니다.",
    });
  }
}
export async function deleteUserAccount(
  request: Request<Record<string, never>, unknown, unknown>,
  response: Response<unknown, AuthenticatedLocals>,
): Promise<Response> {
  const body = request.body;

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    !("currentPassword" in body) ||
    typeof body.currentPassword !== "string"
  ) {
    return response.status(400).json({
      message: "현재 비밀번호를 입력해주세요.",
    });
  }

  const { currentPassword } = body;

  if (
    currentPassword.length < 8 ||
    currentPassword.length > 32 ||
    !/^[\x21-\x7E]+$/.test(currentPassword)
  ) {
    return response.status(400).json({
      message: "현재 비밀번호를 확인해주세요.",
    });
  }

  try {
    const user = await User.findById(
      response.locals.userId,
    ).select("+passwordHash");

    if (!user) {
      return response.status(401).json({
        message: "로그인이 필요합니다.",
      });
    }

    const isPasswordCorrect = await compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordCorrect) {
      return response.status(400).json({
        message: "현재 비밀번호가 올바르지 않습니다.",
      });
    }

    const isDeleted = await User.db.transaction(
      async (session): Promise<boolean> => {
        const result = await User.deleteOne(
          {
            _id: user._id,
            passwordHash: user.passwordHash,
          },
          { session },
        );

        if (result.deletedCount !== 1) {
          return false;
        }

        await Routine.deleteMany(
          { userId: user._id },
          { session },
        );

        await Workout.deleteMany(
          { userId: user._id },
          { session },
        );

        return true;
      },
    );

    if (!isDeleted) {
      return response.status(409).json({
        message:
          "계정 정보가 변경되었습니다. 새로고침 후 다시 시도해주세요.",
      });
    }

    response.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response.status(200).json({
      message: "회원탈퇴가 완료되었습니다.",
    });
  } catch (error) {
    console.error("Failed to delete user account", error);

    return response.status(500).json({
      message: "회원탈퇴 중 서버 오류가 발생했습니다.",
    });
  }
}