import type { Language } from "../contexts/LanguageContext";

export interface RequestPasswordResetRequest {
  email: string;
  language: Language;
}

export interface RequestPasswordResetResponse {
  code: "PASSWORD_RESET_REQUEST_ACCEPTED";
  codeValiditySeconds: number;
  resendAfterSeconds: number;
}

export interface VerifyPasswordResetRequest {
  email: string;
  code: string;
}

export interface VerifyPasswordResetResponse {
  code: "PASSWORD_RESET_CODE_VERIFIED";
  resetToken: string;
  expiresInSeconds: number;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  code: "PASSWORD_RESET_COMPLETED";
}