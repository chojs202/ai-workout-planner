import { useState } from "react";
import type { FormEvent } from "react";
import styled from "styled-components";
import { createUser, UserRequestError } from "../api/users";
import LanguageSelector from "../components/LanguageSelector";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationKey } from "../i18n/translations";
import logo from "../assets/fit-plan-icon.svg";
import { Link, useNavigate } from "react-router-dom";
import CommonModal, {
  ModalActions,
  ModalButton,
} from "../components/common/CommonModal";

const Page = styled.main`
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--section-gap) var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
`;

const SignupCard = styled.section`
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

const LoginGuide = styled.div`
  margin-top: 24px;
  text-align: center;
`;

const LoginLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-min-height);
  padding: 8px 16px;

  color: var(--color-primary);
  font-size: var(--font-caption);
  font-weight: 600;
  border-radius: var(--radius-control);

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

function SignupPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const confirmLabel = {
    ko: "확인",
    ja: "確認",
    en: "OK",
  }[language];

  function handleSuccessConfirm(): void {
    navigate("/login", {
      replace: true,
    });
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  const [createdEmail, setCreatedEmail] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isSubmitting || createdEmail !== "") {
      return;
    }

    setErrorKey(null);
    setCreatedEmail("");

    const normalizedEmail = email.trim().toLowerCase();

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

    if (password !== confirmPassword) {
      setErrorKey("signupPasswordMismatch");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createUser({
        email: normalizedEmail,
        password,
      });

      setCreatedEmail(result.user.email);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorKey(
        error instanceof UserRequestError
          ? error.translationKey
          : "signupFailed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page>
      <SignupCard>
        <LanguageSelector />

        <Brand>
          <BrandLogo src={logo} alt="" />
          <BrandName>Fit Plan</BrandName>
        </Brand>

        <Title>{t("signupTitle")}</Title>

        <Description>{t("signupDescription")}</Description>

        <Form onSubmit={handleSubmit} noValidate>
          <Field>
            <Label htmlFor="email">{t("emailLabel")}</Label>

            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <Label htmlFor="confirmPassword">
              {t("signupConfirmPassword")}
            </Label>

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </Field>

          {errorKey && <ErrorMessage role="alert">{t(errorKey)}</ErrorMessage>}

          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("signupSubmitting") : t("signupSubmit")}
          </SubmitButton>
        </Form>
        <LoginGuide>
          <LoginLink to="/login">{t("loginTitle")}</LoginLink>
        </LoginGuide>
      </SignupCard>

      {createdEmail && (
        <CommonModal
          title={t("signupSuccess")}
          description={createdEmail}
          onClose={handleSuccessConfirm}
          actions={
            <ModalActions>
              <ModalButton
                type="button"
                $tone="primary"
                autoFocus
                onClick={handleSuccessConfirm}
              >
                {confirmLabel}
              </ModalButton>
            </ModalActions>
          }
        />
      )}
    </Page>
  );
}

export default SignupPage;
