import { AuthRequestError } from "./auth";
import type { TranslationKey } from "../i18n/translations";
import type {
    RequestPasswordResetRequest,
    RequestPasswordResetResponse,
    VerifyPasswordResetRequest,
    VerifyPasswordResetResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
} from "../types/passwordReset";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
    return (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value > 0
    );
}

function isRequestPasswordResetResponse(
    data: unknown,
): data is RequestPasswordResetResponse {
    return (
        isRecord(data) &&
        data.code === "PASSWORD_RESET_REQUEST_ACCEPTED" &&
        isPositiveInteger(data.codeValiditySeconds) &&
        isPositiveInteger(data.resendAfterSeconds)
    );
}

function isVerifyPasswordResetResponse(
    data: unknown,
): data is VerifyPasswordResetResponse {
    return (
        isRecord(data) &&
        data.code === "PASSWORD_RESET_CODE_VERIFIED" &&
        typeof data.resetToken === "string" &&
        /^[0-9a-f]{64}$/.test(data.resetToken) &&
        isPositiveInteger(data.expiresInSeconds)
    );
}

function isResetPasswordResponse(
    data: unknown,
): data is ResetPasswordResponse {
    return (
        isRecord(data) &&
        data.code === "PASSWORD_RESET_COMPLETED"
    );
}

function getErrorKey(
    status: number,
    data: unknown,
    fallbackKey: TranslationKey,
): TranslationKey {
    if (status === 429) {
        return "tooManyRequests";
    }

    if (status >= 500) {
        return "serverUnavailable";
    }

    if (isRecord(data)) {
        switch (data.code) {
            case "PASSWORD_RESET_INVALID_REQUEST":
                return "apiInvalidRequest";

            case "PASSWORD_RESET_CODE_INVALID_OR_EXPIRED":
                return "passwordResetCodeInvalidOrExpired";

            case "PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED":
                return "passwordResetTokenInvalidOrExpired";

            case "PASSWORD_RESET_SERVICE_UNAVAILABLE":
                return "serverUnavailable";

            case "PASSWORD_RESET_SAME_PASSWORD":
                return "profilePasswordSame";
        }
    }

    if (status === 400 || status === 422) {
        return "apiInvalidRequest";
    }

    return fallbackKey;
}

async function requestPasswordResetApi<T>(
    path: string,
    requestData: unknown,
    fallbackKey: TranslationKey,
    isValidResponse: (data: unknown) => data is T,
): Promise<T> {
    if (!API_BASE_URL) {
        throw new AuthRequestError("serviceNotConfigured");
    }

    let response: Response;

    try {
        response = await fetch(
            `${API_BASE_URL}/api/auth/password-reset/${path}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(requestData),
            },
        );
    } catch {
        throw new AuthRequestError("networkError");
    }

    let data: unknown;

    try {
        data = await response.json();
    } catch {
        if (!response.ok) {
            throw new AuthRequestError(
                getErrorKey(response.status, undefined, fallbackKey),
                response.status,
            );
        }

        throw new AuthRequestError(
            "invalidServerResponse",
            response.status,
        );
    }

    if (!response.ok) {
        throw new AuthRequestError(
            getErrorKey(response.status, data, fallbackKey),
            response.status,
        );
    }

    if (!isValidResponse(data)) {
        throw new AuthRequestError(
            "invalidServerResponse",
            response.status,
        );
    }

    return data;
}

export async function requestPasswordReset(
    requestData: RequestPasswordResetRequest,
): Promise<RequestPasswordResetResponse> {
    return requestPasswordResetApi(
        "request",
        requestData,
        "passwordResetRequestFailed",
        isRequestPasswordResetResponse,
    );
}

export async function verifyPasswordReset(
    requestData: VerifyPasswordResetRequest,
): Promise<VerifyPasswordResetResponse> {
    return requestPasswordResetApi(
        "verify",
        requestData,
        "passwordResetVerifyFailed",
        isVerifyPasswordResetResponse,
    );
}

export async function resetPassword(
    requestData: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
    return requestPasswordResetApi(
        "complete",
        requestData,
        "passwordResetSaveFailed",
        isResetPasswordResponse,
    );
}