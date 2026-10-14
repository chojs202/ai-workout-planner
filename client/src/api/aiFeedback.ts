import type {
    GenerateWorkoutFeedbackResponse,
} from "../types/aiFeedback";
import {
    ApiRequestError,
    translatedRequest,
} from "./translatedRequest";

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
    return (
        Array.isArray(value) &&
        value.every((item) => typeof item === "string")
    );
}

function isGenerateWorkoutFeedbackResponse(
    data: unknown,
): data is GenerateWorkoutFeedbackResponse {
    if (!isRecord(data) || !isRecord(data.feedback)) {
        return false;
    }

    const feedback = data.feedback;

    return (
        typeof feedback.summary === "string" &&
        isStringArray(feedback.achievements) &&
        isStringArray(feedback.improvements) &&
        isStringArray(feedback.nextWorkoutTips) &&
        typeof feedback.dataNotice === "string" &&
        typeof data.basedOnWorkoutCount === "number"
    );
}

export async function generateWorkoutFeedback(
    language: "ko" | "ja" | "en",
): Promise<GenerateWorkoutFeedbackResponse> {
    const data = await translatedRequest(
        "/api/ai/routines/feedback",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ language }),
        },
        "historyFeedbackFailed",
    );

    if (!isGenerateWorkoutFeedbackResponse(data)) {
        throw new ApiRequestError("invalidServerResponse");
    }

    return data;
}