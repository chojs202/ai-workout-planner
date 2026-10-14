export interface AiWorkoutFeedback {
    summary: string;
    achievements: string[];
    improvements: string[];
    nextWorkoutTips: string[];
    dataNotice: string;
}

export interface GenerateWorkoutFeedbackResponse {
    feedback: AiWorkoutFeedback;
    basedOnWorkoutCount: number;
}

export interface GenerateWorkoutFeedbackErrorResponse {
    message: string;
}