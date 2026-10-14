import { model, Schema } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    tokenVersion: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "토큰 버전은 안전한 정수여야 합니다.",
      },
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>("User", userSchema);