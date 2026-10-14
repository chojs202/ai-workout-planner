import { model, Schema } from "mongoose";
import type { Types } from "mongoose";

export interface IPasswordReset {
    userId: Types.ObjectId;
    codeHash: string;
    codeExpiresAt: Date;
    attempts: number;
    lastSentAt: Date;
    resetTokenHash: string | null;
    resetTokenExpiresAt: Date | null;
    deleteAfter: Date;
    createdAt: Date;
    updatedAt: Date;
    issuedTokenVersion: number;
}

const passwordResetSchema = new Schema<IPasswordReset>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
            unique: true,
        },
        
        issuedTokenVersion: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
            validate: {
                validator: Number.isSafeInteger,
                message: "토큰 버전은 안전한 정수여야 합니다.",
            },
        },

        codeHash: {
            type: String,
            required: true,
            select: false,
        },

        codeExpiresAt: {
            type: Date,
            required: true,
        },

        attempts: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: "인증 시도 횟수는 정수여야 합니다.",
            },
        },

        lastSentAt: {
            type: Date,
            required: true,
        },

        resetTokenHash: {
            type: String,
            default: null,
            select: false,
        },

        resetTokenExpiresAt: {
            type: Date,
            default: null,
        },

        deleteAfter: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

passwordResetSchema.index(
    { deleteAfter: 1 },
    { expireAfterSeconds: 0 },
);

export const PasswordReset = model<IPasswordReset>(
    "PasswordReset",
    passwordResetSchema,
);