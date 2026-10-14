import "dotenv/config";
import {
  sendPasswordResetEmail,
} from "../utils/sendPasswordResetEmail.js";
import type {
  PasswordResetLanguage,
} from "../utils/sendPasswordResetEmail.js";

async function main(): Promise<void> {
  const email = process.env.BREVO_SENDER_EMAIL?.trim();
  const language = process.argv[2] ?? "ko";

  if (!email) {
    throw new Error("BREVO_SENDER_EMAIL을 설정해주세요.");
  }

  if (
    language !== "ko" &&
    language !== "ja" &&
    language !== "en"
  ) {
    throw new Error("언어는 ko, ja, en 중 하나를 입력해주세요.");
  }

  await sendPasswordResetEmail(
    email,
    "123456",
    language satisfies PasswordResetLanguage,
  );

  console.log("테스트 메일 발송 요청이 접수됐습니다. 받은편지함과 스팸함을 확인해주세요.");
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "테스트 메일 발송에 실패했습니다.",
  );

  process.exitCode = 1;
});