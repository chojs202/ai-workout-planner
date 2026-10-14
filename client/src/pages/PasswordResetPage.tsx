import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  requestPasswordReset,
  verifyPasswordReset,
  resetPassword,
} from "../api/passwordReset";
import { AuthRequestError } from "../api/auth";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationKey } from "../i18n/translations";
import LanguageSelector from "../components/LanguageSelector";

const Page = styled.main`
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--section-gap) var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
`;

const Card = styled.section`
  width: 100%;
  min-width: 0;
  max-width: 420px;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;

const Title = styled.h1`
  margin-bottom: 12px;
  font-size: var(--font-page-title);
  line-height: 1.4;
  text-align: center;
`;

const Description = styled.p`
  margin-bottom: 24px;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.7;
  text-align: center;
  overflow-wrap: anywhere;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  min-width: 0;
  min-height: var(--control-min-height);
  padding: 10px 12px;
  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: 16px;
  line-height: 1.5;
  color-scheme: dark;

  &[aria-invalid="true"] {
    border-color: var(--color-error);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const PrimaryButton = styled.button`
  width: 100%;
  min-height: var(--control-min-height);
  padding: 10px 12px;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: var(--radius-control);
  font-weight: 700;
  line-height: 1.5;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(PrimaryButton)`
  color: var(--color-text);
  background: var(--color-input);
  border: 1px solid var(--color-border);

  &:hover:not(:disabled) {
    background: var(--color-background);
  }
`;

const Notice = styled.p`
  padding: 12px;
  color: var(--color-text-muted);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;
`;

const ErrorMessage = styled(Notice)`
  color: var(--color-error);
  background: rgb(255 133 133 / 8%);
  border-color: rgb(255 133 133 / 30%);
`;

const Timer = styled.p`
  color: var(--color-primary);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  text-align: center;
`;

const LoginLink = styled(Link)`
  display: block;
  margin-top: 24px;
  padding: 8px;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
  text-align: center;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

type Step = "email" | "code" | "password" | "success";
type InvalidField = "email" | "code" | "password" | "confirm" | null;

function remainingSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function PasswordResetPage() {
  const { t, language } = useTranslation();
  const { setUser } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [invalidField, setInvalidField] = useState<InvalidField>(null);
  const [resendAt, setResendAt] = useState(0);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const pendingRef = useRef(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const resendSeconds = remainingSeconds(resendAt, now);
  const tokenSeconds = remainingSeconds(tokenExpiresAt, now);

  useEffect(() => {
    if (step === "success") {
      return;
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [step]);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (step === "password" && tokenSeconds === 0 && !isSubmitting) {
      setResetToken("");
      setPassword("");
      setConfirmPassword("");
      setCode("");
      setInvalidField(null);
      setErrorKey("passwordResetTokenInvalidOrExpired");
      setStep("code");
    }
  }, [step, tokenSeconds, isSubmitting]);

  function clearError(): void {
    setErrorKey(null);
    setInvalidField(null);
  }

  function showFieldError(key: TranslationKey, field: InvalidField): void {
    setErrorKey(key);
    setInvalidField(field);
  }

  function changeEmail(): void {
    if (pendingRef.current) {
      return;
    }

    clearError();
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setResetToken("");
    setTokenExpiresAt(0);
    setStep("email");
  }

  async function handleRequestCode(): Promise<void> {
    if (pendingRef.current) {
      return;
    }

    clearError();

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length > 254) {
      showFieldError("emailTooLong", "email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showFieldError("invalidEmail", "email");
      return;
    }

    if (Date.now() < resendAt) {
      return;
    }

    pendingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset({
        email: normalizedEmail,
        language,
      });

      const receivedAt = Date.now();

      setEmail(normalizedEmail);
      setCode("");
      setResetToken("");
      setResendAt(receivedAt + result.resendAfterSeconds * 1000);
      setNow(receivedAt);
      setStep("code");
    } catch (error) {
      setErrorKey(
        error instanceof AuthRequestError
          ? error.translationKey
          : "passwordResetRequestFailed",
      );
    } finally {
      pendingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode(): Promise<void> {
    if (pendingRef.current) {
      return;
    }

    clearError();

    if (!/^\d{6}$/.test(code)) {
      showFieldError("passwordResetCodeInvalidFormat", "code");
      return;
    }

    pendingRef.current = true;
    setIsSubmitting(true);

    const requestedAt = Date.now();

    try {
      const result = await verifyPasswordReset({ email, code });

      setResetToken(result.resetToken);
      setTokenExpiresAt(requestedAt + result.expiresInSeconds * 1000);
      setNow(Date.now());
      setCode("");
      setStep("password");
    } catch (error) {
      const key =
        error instanceof AuthRequestError
          ? error.translationKey
          : "passwordResetVerifyFailed";

      setErrorKey(key);

      if (key === "passwordResetCodeInvalidOrExpired") {
        setInvalidField("code");
      }
    } finally {
      pendingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleSavePassword(): Promise<void> {
    if (pendingRef.current) {
      return;
    }

    clearError();

    if (!resetToken || Date.now() >= tokenExpiresAt) {
      setErrorKey("passwordResetTokenInvalidOrExpired");
      setResetToken("");
      setPassword("");
      setConfirmPassword("");
      setStep("code");
      return;
    }

    if (password.length < 8) {
      showFieldError("passwordTooShort", "password");
      return;
    }

    if (password.length > 32) {
      showFieldError("passwordTooLong", "password");
      return;
    }

    if (!/^[\x21-\x7E]+$/.test(password)) {
      showFieldError("passwordInvalidCharacters", "password");
      return;
    }

    if (password !== confirmPassword) {
      showFieldError("profilePasswordMismatch", "confirm");
      return;
    }

    pendingRef.current = true;
    setIsSubmitting(true);

    try {
      await resetPassword({
        email,
        resetToken,
        newPassword: password,
      });

      setUser(null);
      setPassword("");
      setConfirmPassword("");
      setResetToken("");
      setStep("success");
    } catch (error) {
      const key =
        error instanceof AuthRequestError
          ? error.translationKey
          : "passwordResetSaveFailed";

      setErrorKey(key);

      if (key === "profilePasswordSame") {
        setInvalidField("password");
      }

      if (key === "passwordResetTokenInvalidOrExpired") {
        setResetToken("");
        setPassword("");
        setConfirmPassword("");
        setStep("code");
      }
    } finally {
      pendingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (step === "email") {
      void handleRequestCode();
    } else if (step === "code") {
      void handleVerifyCode();
    } else if (step === "password") {
      void handleSavePassword();
    }
  }

  const errorDescription = errorKey ? "password-reset-error" : undefined;

  return (
    <Page>
      <Card>
        <LanguageSelector />

        <Title>
          {t(
            step === "success"
              ? "passwordResetSuccessTitle"
              : "passwordResetTitle",
          )}
        </Title>

        <Description>
          {t(
            step === "success"
              ? "passwordResetSuccessDescription"
              : "passwordResetDescription",
          )}
        </Description>

        {step !== "success" && (
          <Form onSubmit={handleSubmit} noValidate>
            {step === "email" && (
              <Field>
                <Label htmlFor="reset-email">{t("emailLabel")}</Label>

                <Input
                  ref={firstInputRef}
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearError();
                  }}
                  disabled={isSubmitting}
                  aria-invalid={invalidField === "email"}
                  aria-describedby={errorDescription}
                />
              </Field>
            )}

            {step === "code" && (
              <>
                <Notice>{t("passwordResetRequestAccepted")}</Notice>
                <Notice>{email}</Notice>

                <Field>
                  <Label htmlFor="reset-code">
                    {t("passwordResetCodeLabel")}
                  </Label>

                  <Input
                    ref={firstInputRef}
                    id="reset-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) => {
                      setCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      );
                      clearError();
                    }}
                    disabled={isSubmitting}
                    aria-invalid={invalidField === "code"}
                    aria-describedby={[
                      "reset-code-description",
                      errorDescription,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                </Field>

                <Notice id="reset-code-description">
                  {t("passwordResetCodeDescription")}
                </Notice>
              </>
            )}

            {step === "password" && (
              <>
                <Notice id="reset-password-description">
                  {t("passwordResetNewPasswordDescription")}
                </Notice>

                <Timer>
                  {t("passwordResetTokenTimeLeft")} {formatTime(tokenSeconds)}
                </Timer>

                <Field>
                  <Label htmlFor="reset-password">
                    {t("profileNewPassword")}
                  </Label>

                  <Input
                    ref={firstInputRef}
                    id="reset-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearError();
                    }}
                    disabled={isSubmitting}
                    aria-invalid={invalidField === "password"}
                    aria-describedby={[
                      "reset-password-description",
                      errorDescription,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                </Field>

                <Field>
                  <Label htmlFor="reset-password-confirm">
                    {t("profileConfirmPassword")}
                  </Label>

                  <Input
                    id="reset-password-confirm"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearError();
                    }}
                    disabled={isSubmitting}
                    aria-invalid={invalidField === "confirm"}
                    aria-describedby={errorDescription}
                  />
                </Field>
              </>
            )}

            {errorKey && (
              <ErrorMessage id="password-reset-error" role="alert">
                {t(errorKey)}
              </ErrorMessage>
            )}

            <PrimaryButton
              type="submit"
              disabled={isSubmitting || (step === "email" && resendSeconds > 0)}
            >
              {step === "email"
                ? t(
                    isSubmitting
                      ? "passwordResetRequesting"
                      : "passwordResetRequestCode",
                  )
                : step === "code"
                  ? t(
                      isSubmitting
                        ? "passwordResetVerifying"
                        : "passwordResetVerifyCode",
                    )
                  : t(
                      isSubmitting
                        ? "passwordResetSaving"
                        : "passwordResetSave",
                    )}
            </PrimaryButton>

            {(step === "email" || step === "code") && resendSeconds > 0 && (
              <Timer>
                {t("passwordResetResendWait")} {formatTime(resendSeconds)}
              </Timer>
            )}

            {step === "code" && (
              <SecondaryButton
                type="button"
                disabled={isSubmitting || resendSeconds > 0}
                onClick={() => {
                  void handleRequestCode();
                }}
              >
                {t("passwordResetResendCode")}
              </SecondaryButton>
            )}

            {(step === "code" || step === "password") && (
              <SecondaryButton
                type="button"
                disabled={isSubmitting}
                onClick={changeEmail}
              >
                {t("passwordResetChangeEmail")}
              </SecondaryButton>
            )}
          </Form>
        )}

        <LoginLink to="/login">{t("passwordResetGoToLogin")}</LoginLink>
      </Card>
    </Page>
  );
}

export default PasswordResetPage;
