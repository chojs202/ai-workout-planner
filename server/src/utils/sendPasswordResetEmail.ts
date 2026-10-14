export type PasswordResetLanguage = "ko" | "ja" | "en";

const emailMessages = {
  ko: {
    subject: "[Fit Plan] 비밀번호 재설정 인증코드",
    introduction: "Fit Plan 비밀번호 재설정을 위한 인증코드입니다.",
    codeLabel: "인증코드",
    expiry: "인증코드는 3분 동안 유효합니다.",
    instruction: "비밀번호 재설정 화면에서 인증코드를 입력해주세요.",
    ignore: "본인이 요청하지 않았다면 이 메일을 무시해주세요.",
    warning: "인증코드를 다른 사람에게 알려주지 마세요.",
  },
  ja: {
    subject: "[Fit Plan] パスワード再設定の認証コード",
    introduction: "Fit Planのパスワード再設定用の認証コードです。",
    codeLabel: "認証コード",
    expiry: "認証コードの有効期限は3分です。",
    instruction: "パスワード再設定画面で認証コードを入力してください。",
    ignore: "この操作に心当たりがない場合は、このメールを無視してください。",
    warning: "認証コードを他の人に教えないでください。",
  },
  en: {
    subject: "[Fit Plan] Password reset verification code",
    introduction: "Here is your verification code to reset your Fit Plan password.",
    codeLabel: "Verification code",
    expiry: "This code is valid for 3 minutes.",
    instruction: "Enter this code on the password reset screen.",
    ignore: "If you did not request a password reset, ignore this email.",
    warning: "Do not share this code with anyone.",
  },
};

export async function sendPasswordResetEmail(
  email: string,
  code: string,
  language: PasswordResetLanguage = "ko",
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName =
    process.env.BREVO_SENDER_NAME?.trim() || "Fit Plan";

  if (!apiKey || !senderEmail) {
    throw new Error("Brevo 메일 발송 환경변수가 설정되지 않았습니다.");
  }

  const messages = emailMessages[language];

  const textContent = [
    messages.introduction,
    "",
    `${messages.codeLabel}: ${code}`,
    "",
    messages.expiry,
    messages.instruction,
    "",
    messages.ignore,
    messages.warning,
  ].join("\n");

  const escapedContent = textContent
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  let response: Response;

  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email }],
        subject: messages.subject,
        textContent,
        htmlContent:
          `<div lang="${language}" style="font-family: sans-serif; white-space: pre-wrap; line-height: 1.6;">` +
          escapedContent +
          "</div>",
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("메일 서버 연결에 실패했거나 응답 시간이 초과되었습니다.");
  }

  if (!response.ok) {
    throw new Error(
      `Brevo 메일 발송 요청이 실패했습니다. HTTP ${response.status}`,
    );
  }
}