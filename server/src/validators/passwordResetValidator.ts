import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .max(254, "이메일은 254자 이하여야 합니다.")
  .regex(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    "올바른 이메일 형식이 아닙니다.",
  )
  .transform((value) => value.toLowerCase());

export const requestPasswordResetSchema = z
  .object({
    email: emailSchema,
    language: z.enum(["ko", "ja", "en"]).default("ko"),
  })
  .strict();

export const verifyPasswordResetSchema = z
  .object({
    email: emailSchema,
    code: z
      .string()
      .trim()
      .regex(
        /^\d{6}$/,
        "인증코드는 숫자 6자리여야 합니다.",
      ),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    resetToken: z
      .string()
      .regex(
        /^[0-9a-f]{64}$/,
        "비밀번호 재설정 인증 정보가 올바르지 않습니다.",
      ),
    newPassword: z
      .string()
      .min(8, "비밀번호는 8자 이상이어야 합니다.")
      .max(32, "비밀번호는 32자 이하여야 합니다.")
      .regex(
        /^[\x21-\x7E]+$/,
        "비밀번호는 공백 없이 영문, 숫자, 특수문자만 사용할 수 있습니다.",
      ),
  })
  .strict();

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;

export type VerifyPasswordResetInput = z.infer<
  typeof verifyPasswordResetSchema
>;

export type ResetPasswordInput = z.infer<
  typeof resetPasswordSchema
>;