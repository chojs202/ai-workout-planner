import {
    createHash,
    createHmac,
    randomBytes,
    randomInt,
    timingSafeEqual,
} from "node:crypto";
import { compare, hash } from "bcryptjs";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { PasswordReset } from "../models/PasswordReset.js";
import {
    sendPasswordResetEmail,
} from "../utils/sendPasswordResetEmail.js";
import type {
    PasswordResetLanguage,
} from "../utils/sendPasswordResetEmail.js";
import {
    requestPasswordResetSchema,
    verifyPasswordResetSchema,
    resetPasswordSchema,
} from "../validators/passwordResetValidator.js";

const CODE_DURATION_MS = 3 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;
const RESET_TOKEN_DURATION_MS = 5 * 60 * 1000;
const CLEANUP_DURATION_MS = 15 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

class InvalidResetError extends Error { }
class SamePasswordError extends Error { }

function hashCode(userId: string, code: string): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET이 설정되지 않았습니다.");
    }

    return createHmac("sha256", secret)
        .update(JSON.stringify(["password-reset", userId, code]))
        .digest("hex");
}

function hashResetToken(token: string): string {
    return createHash("sha256")
        .update(token)
        .digest("hex");
}

function hashesMatch(first: string, second: string): boolean {
    if (
        !/^[0-9a-f]{64}$/.test(first) ||
        !/^[0-9a-f]{64}$/.test(second)
    ) {
        return false;
    }

    return timingSafeEqual(
        Buffer.from(first, "hex"),
        Buffer.from(second, "hex"),
    );
}

function isDuplicateKeyError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
    );
}

function acceptedEmailRequest(response: Response): Response {
    return response.status(200).json({
        code: "PASSWORD_RESET_REQUEST_ACCEPTED",
        codeValiditySeconds: CODE_DURATION_MS / 1000,
        resendAfterSeconds: RESEND_INTERVAL_MS / 1000,
    });
}

async function deliverCode(
    userId: string,
    email: string,
    code: string,
    codeHash: string,
    language: PasswordResetLanguage,
): Promise<void> {
    try {
        await sendPasswordResetEmail(email, code, language);
    } catch {
        console.error("비밀번호 재설정 메일 발송에 실패했습니다.");

        try {
            await PasswordReset.deleteOne({
                userId,
                codeHash,
                resetTokenHash: null,
            });
        } catch {
            console.error("발송 실패한 인증 정보 정리에 실패했습니다.");
        }
    }
}

export async function requestPasswordReset(
    request: Request,
    response: Response,
): Promise<Response> {
    const parsed = requestPasswordResetSchema.safeParse(request.body);

    if (!parsed.success) {
        return response.status(400).json({
            code: "PASSWORD_RESET_INVALID_REQUEST",
            fields: parsed.error.issues.map((issue) =>
                issue.path.join("."),
            ),
        });
    }

    const { email, language } = parsed.data;

    try {
        // 계정별 중복 발급을 막는 unique 인덱스를 준비합니다.
        await PasswordReset.init();

        const user = await User.findOne({ email })
            .select("_id tokenVersion")
            .lean();

        // 가입되지 않은 이메일에는 인증코드를 발급하지 않습니다.
        if (!user) {
            return response.status(404).json({
                code: "PASSWORD_RESET_EMAIL_NOT_FOUND",
            });
        }

        const userId = user._id.toString();
        const now = new Date();
        const code = randomInt(0, 1_000_000)
            .toString()
            .padStart(6, "0");
        const codeHash = hashCode(userId, code);

        try {
            await PasswordReset.findOneAndUpdate(
                {
                    userId: user._id,
                    lastSentAt: {
                        $lte: new Date(now.getTime() - RESEND_INTERVAL_MS),
                    },
                },
                {
                    $set: {
                        issuedTokenVersion: user.tokenVersion ?? 0,
                        codeHash,
                        codeExpiresAt: new Date(
                            now.getTime() + CODE_DURATION_MS,
                        ),
                        attempts: 0,
                        lastSentAt: now,
                        resetTokenHash: null,
                        resetTokenExpiresAt: null,
                        deleteAfter: new Date(
                            now.getTime() + CLEANUP_DURATION_MS,
                        ),
                    },
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                },
            );
        } catch (error) {
            if (isDuplicateKeyError(error)) {
                // 60초 이내 재요청 또는 동시에 들어온 중복 요청입니다.
                // 새 코드를 보내지 않고 동일한 접수 응답을 반환합니다.
                return acceptedEmailRequest(response);
            }

            throw error;
        }

        // 메일 처리 시간으로 가입 여부가 드러나지 않도록
        // 실제 발송은 백그라운드에서 진행합니다.
        void deliverCode(
            userId,
            email,
            code,
            codeHash,
            language,
        );

        return acceptedEmailRequest(response);
    } catch {
        console.error("비밀번호 재설정 요청 처리에 실패했습니다.");

        return response.status(503).json({
            code: "PASSWORD_RESET_SERVICE_UNAVAILABLE",
        });
    }
}

export async function verifyPasswordReset(
    request: Request,
    response: Response,
): Promise<Response> {
    const parsed = verifyPasswordResetSchema.safeParse(request.body);

    if (!parsed.success) {
        return response.status(400).json({
            code: "PASSWORD_RESET_INVALID_REQUEST",
            fields: parsed.error.issues.map((issue) =>
                issue.path.join("."),
            ),
        });
    }

    const { email, code } = parsed.data;

    try {
        const user = await User.findOne({ email })
            .select("_id tokenVersion")
            .lean();

        if (!user) {
            return response.status(400).json({
                code: "PASSWORD_RESET_CODE_INVALID_OR_EXPIRED",
            });
        }

        // 확인 시도 횟수를 원자적으로 증가시킵니다.
        // 반환값은 증가하기 전 문서입니다.
        const reset = await PasswordReset.findOneAndUpdate(
            {
                userId: user._id,
                issuedTokenVersion: user.tokenVersion ?? 0,
                codeExpiresAt: { $gt: new Date() },
                attempts: { $lt: MAX_CODE_ATTEMPTS },
                resetTokenHash: null,
            },
            {
                $inc: { attempts: 1 },
            },
            {
                new: false,
            },
        ).select("+codeHash");

        if (
            !reset ||
            !hashesMatch(
                reset.codeHash,
                hashCode(user._id.toString(), code),
            )
        ) {
            return response.status(400).json({
                code: "PASSWORD_RESET_CODE_INVALID_OR_EXPIRED",
            });
        }

        const resetToken = randomBytes(32).toString("hex");
        const resetTokenExpiresAt = new Date(
            Date.now() + RESET_TOKEN_DURATION_MS,
        );

        // 재발송되거나 다른 요청에서 이미 인증한 코드는
        // 임시 토큰을 발급할 수 없습니다.
        const result = await PasswordReset.updateOne(
            {
                _id: reset._id,
                codeHash: reset.codeHash,
                issuedTokenVersion: reset.issuedTokenVersion,
                codeExpiresAt: { $gt: new Date() },
                lastSentAt: reset.lastSentAt,
                resetTokenHash: null,
            },
            {
                $set: {
                    resetTokenHash: hashResetToken(resetToken),
                    resetTokenExpiresAt,
                    deleteAfter: new Date(
                        Date.now() + CLEANUP_DURATION_MS,
                    ),
                },
            },
            {
                runValidators: true,
            },
        );

        if (result.modifiedCount !== 1) {
            return response.status(400).json({
                code: "PASSWORD_RESET_CODE_INVALID_OR_EXPIRED",
            });
        }

        response.setHeader("Cache-Control", "no-store");

        return response.status(200).json({
            code: "PASSWORD_RESET_CODE_VERIFIED",
            resetToken,
            expiresInSeconds: RESET_TOKEN_DURATION_MS / 1000,
        });
    } catch {
        console.error("비밀번호 재설정 코드 확인에 실패했습니다.");

        return response.status(503).json({
            code: "PASSWORD_RESET_SERVICE_UNAVAILABLE",
        });
    }
}

export async function resetPassword(
    request: Request,
    response: Response,
): Promise<Response> {
    const parsed = resetPasswordSchema.safeParse(request.body);

    if (!parsed.success) {
        return response.status(400).json({
            code: "PASSWORD_RESET_INVALID_REQUEST",
            fields: parsed.error.issues.map((issue) =>
                issue.path.join("."),
            ),
        });
    }

    const { email, resetToken, newPassword } = parsed.data;
    const resetTokenHash = hashResetToken(resetToken);

    try {
        const user = await User.findOne({ email })
            .select("_id")
            .lean();

        if (!user) {
            return response.status(400).json({
                code: "PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED",
            });
        }

        const validReset = await PasswordReset.exists({
            userId: user._id,
            resetTokenHash,
            resetTokenExpiresAt: { $gt: new Date() },
        });

        if (!validReset) {
            return response.status(400).json({
                code: "PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED",
            });
        }

        const passwordHash = await hash(newPassword, 12);

        await mongoose.connection.transaction(async (session) => {
            const reset = await PasswordReset.findOneAndDelete(
                {
                    userId: user._id,
                    resetTokenHash,
                    resetTokenExpiresAt: { $gt: new Date() },
                },
                {
                    session,
                },
            );

            if (!reset) {
                throw new InvalidResetError();
            }

            const versionFilter =
                reset.issuedTokenVersion === 0
                    ? {
                        $or: [
                            { tokenVersion: 0 },
                            { tokenVersion: { $exists: false } },
                        ],
                    }
                    : {
                        tokenVersion: reset.issuedTokenVersion,
                    };
            const currentUser = await User.findOne({
                _id: user._id,
                ...versionFilter,
            })
                .select("+passwordHash")
                .session(session)
                .lean();

            if (!currentUser) {
                throw new InvalidResetError();
            }

            const isSamePassword = await compare(
                newPassword,
                currentUser.passwordHash,
            );

            if (isSamePassword) {
                throw new SamePasswordError();
            }

            const result = await User.updateOne(
                {
                    _id: user._id,
                    ...versionFilter,
                },
                {
                    $set: { passwordHash },
                    $inc: { tokenVersion: 1 },
                },
                {
                    session,
                    runValidators: true,
                },
            );

            if (result.modifiedCount !== 1) {
                throw new InvalidResetError();
            }
        });

        response.clearCookie("auth_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        return response.status(200).json({
            code: "PASSWORD_RESET_COMPLETED",
        });
    } catch (error) {
        if (error instanceof SamePasswordError) {
            return response.status(400).json({
                code: "PASSWORD_RESET_SAME_PASSWORD",
            });
        }

        if (error instanceof InvalidResetError) {
            return response.status(400).json({
                code: "PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED",
            });
        }

        console.error("비밀번호 재설정 저장에 실패했습니다.");

        return response.status(503).json({
            code: "PASSWORD_RESET_SERVICE_UNAVAILABLE",
        });
    }
}