import OpenAI from "openai";

let openAIClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY 환경변수가 설정되지 않았습니다.",
    );
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey,
      maxRetries: 0,
      timeout: 60_000,
    });
  }

  return openAIClient;
}

export function getOpenAIModel(): string {
  const model = process.env.OPENAI_MODEL;

  if (!model) {
    throw new Error(
      "OPENAI_MODEL 환경변수가 설정되지 않았습니다.",
    );
  }

  return model;
}