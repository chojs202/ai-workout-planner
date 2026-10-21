import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { AuthRequestError, login } from "../api/auth";
import { useAuth } from "../contexts/AuthContext";
import LanguageSelector from "../components/LanguageSelector";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationKey } from "../i18n/translations";
import logo from "../assets/fit-plan-icon.svg";

const Page = styled.main`
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--section-gap) var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
`;

const LoginCard = styled.section`
  width: 100%;
  min-width: 0;
  max-width: 420px;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  text-align: center;
`;

const BrandLogo = styled.img`
  display: block;
  flex-shrink: 0;
  width: clamp(64px, 18vw, 80px);
  height: clamp(64px, 18vw, 80px);
  object-fit: contain;
`;

const BrandName = styled.p`
  color: var(--color-text);
  font-family: "Pretendard", sans-serif;
  font-size: clamp(28px, 7vw, 32px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.035em;
  white-space: nowrap;
`;

const Title = styled.h1`
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
`;

const Description = styled.p`
  margin-bottom: 24px;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
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
  gap: 7px;
  min-width: 0;
`;

const Label = styled.label`
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
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

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  min-height: var(--control-min-height);
  margin-top: 8px;
  padding: 10px 12px;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-control);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const ErrorMessage = styled.p`
  padding: 12px;
  color: var(--color-error);
  background: rgb(255 133 133 / 8%);
  border: 1px solid rgb(255 133 133 / 25%);
  border-radius: var(--radius-control);
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const SignupGuide = styled.p`
  margin-top: 24px;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
`;

const SignupLink = styled(Link)`
  color: var(--color-primary);
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
    border-radius: 4px;
  }
`;

const ForgotPasswordLink = styled(SignupLink)`
  display: block;
  margin-top: 16px;
  padding: 8px;
  font-size: 14px;
  text-align: center;
`;

const AboutLink = styled(SignupLink)`
  display: block;
  margin-top: 24px;
  padding: 12px 8px 0;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
  font-size: 13px;
  text-align: center;
`;

function LoginPage() {
  const { user, isAuthLoading, authErrorMessage, setUser, retryAuth } =
    useAuth();

  const { t, language } = useTranslation();

  const aboutLabel = {
    ko: "Fit Plan 서비스 소개",
    ja: "Fit Planについて",
    en: "About Fit Plan",
  }[language];

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorKey(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === "" || password === "") {
      setErrorKey("loginRequiredFields");
      return;
    }

    if (normalizedEmail.length > 254) {
      setErrorKey("emailTooLong");
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!isValidEmail) {
      setErrorKey("invalidEmail");
      return;
    }

    if (password.length < 8) {
      setErrorKey("passwordTooShort");
      return;
    }

    if (password.length > 32) {
      setErrorKey("passwordTooLong");
      return;
    }

    const hasOnlyAllowedPasswordCharacters = /^[\x21-\x7E]+$/.test(password);

    if (!hasOnlyAllowedPasswordCharacters) {
      setErrorKey("passwordInvalidCharacters");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({
        email: normalizedEmail,
        password,
      });

      setUser(result.user);
      setPassword("");

      navigate("/calendar", { replace: true });
    } catch (error) {
      setErrorKey(
        error instanceof AuthRequestError
          ? error.translationKey
          : "loginFailed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading) {
    return (
      <Page>
        <LoginCard>
          <LanguageSelector />
          <Description role="status">{t("authChecking")}</Description>
        </LoginCard>
      </Page>
    );
  }

  if (authErrorMessage) {
    return (
      <Page>
        <LoginCard>
          <LanguageSelector />
          <Title>{t("authCheckFailedTitle")}</Title>

          <ErrorMessage role="alert">{authErrorMessage}</ErrorMessage>

          <SubmitButton
            type="button"
            onClick={() => {
              void retryAuth();
            }}
            disabled={isAuthLoading}
          >
            {t("retry")}
          </SubmitButton>
        </LoginCard>
      </Page>
    );
  }
  if (user) {
    return <Navigate to="/calendar" replace />;
  }

  const displayedError = errorKey ? t(errorKey) : "";

  return (
    <Page>
      <LoginCard>
        <LanguageSelector />

        <Brand>
          <BrandLogo src={logo} alt="" />
          <BrandName>Fit Plan</BrandName>
        </Brand>

        <Title>{t("loginTitle")}</Title>

        <Description>{t("loginDescription")}</Description>

        <Form onSubmit={handleSubmit} noValidate>
          <Field>
            <Label htmlFor="email">{t("emailLabel")}</Label>

            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              autoComplete="email"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <Label htmlFor="password">{t("passwordLabel")}</Label>

            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </Field>

          {displayedError && (
            <ErrorMessage role="alert">{displayedError}</ErrorMessage>
          )}

          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("loginSubmitting") : t("loginTitle")}
          </SubmitButton>
        </Form>
        <ForgotPasswordLink to="/password-reset">
          {t("passwordResetForgotPassword")}
        </ForgotPasswordLink>
        <SignupGuide>
          {t("signupGuide")}{" "}
          <SignupLink to="/signup">{t("signupLink")}</SignupLink>
        </SignupGuide>

        <AboutLink to="/about">{aboutLabel}</AboutLink>
      </LoginCard>
    </Page>
  );
}

export default LoginPage;
