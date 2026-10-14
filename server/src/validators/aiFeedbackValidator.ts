import { z } from "zod";

export const generateWorkoutFeedbackRequestSchema = z.object({
  language: z.enum(["ko", "ja", "en"]),
});

const feedbackItemSchema = z
  .string()
  .trim()
  .min(1)
  .max(200);

export const aiWorkoutFeedbackSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(1)
    .max(500),

  achievements: z
    .array(feedbackItemSchema)
    .max(3),

  improvements: z
    .array(feedbackItemSchema)
    .max(3),

  nextWorkoutTips: z
    .array(feedbackItemSchema)
    .max(3),

  dataNotice: z
    .string()
    .trim()
    .min(1)
    .max(300),
});

export type GenerateWorkoutFeedbackRequest = z.infer<
  typeof generateWorkoutFeedbackRequestSchema
>;

export type AiWorkoutFeedback = z.infer<
  typeof aiWorkoutFeedbackSchema
>;