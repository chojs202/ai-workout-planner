import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  deleteUserAccount,
  UserRequestError,
} from "../api/users";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationKey } from "../i18n/translations";

const Page = styled.main`
  padding: var(--section-gap) var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: 16px;

  color: var(--color-text-muted);
  font-size: 14px;

  &:hover {
    color: var(--color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }
`;

const Title = styled.h1`
  margin-bottom: var(--section-gap);

  font-size: var(--font-page-title);
  font-weight: 700;
  line-height: 1.4;
`;

const Card = styled.section`
  min-width: 0;
  padding: var(--card-padding);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;

const Description = styled.p`
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;
`;

const Warning = styled.div`
  margin: 20px 0;
  padding: 16px;

  color: var(--color-error);
  background: rgb(255 133 133 / 8%);
  border: 1px solid rgb(255 133 133 / 25%);
  border-radius: var(--radius-control);

  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;

  > strong {
    display: block;
    margin-bottom: 8px;
  }

  > ul {
    display: grid;
    gap: 6px;
    padding-left: 18px;
    list-style: disc;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 16px;
`;

const Field = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const Label = styled.label`
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
  color-scheme: dark;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const Agreement = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;

  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
  cursor: pointer;

  > input {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: var(--color-primary);
  }
`;

const DeleteButton = styled.button`
  width: 100%;
  min-height: var(--control-min-height);
  padding: 12px;

  color: var(--color-error);
  background: rgb(255 133 133 / 10%);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-control);

  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;

  &:hover:not(:disabled) {
    background: rgb(255 133 133 / 18%);
  }

  &:focus-visible {
    outline: 2px solid var(--color-error);
    outline-offset: 3px;
  }

  &:disabled {
    opacity: 0.4;
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

function DeleteAccountPage() {
  const { user, setUser } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] =
    useState<TranslationKey | null>(null);

  const copy = {
    ko: {
      title: "회원탈퇴",
      back: "← 회원정보로 돌아가기",
      description: "탈퇴 전에 아래 내용을 확인해주세요.",
      warning: "탈퇴하면 다음 데이터가 영구 삭제됩니다.",
      account: "계정과 회원정보",
      routines: "저장한 모든 루틴",
      workouts: "모든 운동기록",
      agreement:
        "삭제된 데이터는 복구할 수 없다는 내용을 확인했으며, 회원탈퇴에 동의합니다.",
      submit: "계정 영구 삭제",
      submitting: "탈퇴 처리 중…",
    },
    ja: {
      title: "退会",
      back: "← 会員情報に戻る",
      description: "退会前に以下の内容をご確認ください。",
      warning: "退会すると以下のデータが完全に削除されます。",
      account: "アカウントと会員情報",
      routines: "保存したすべてのルーティン",
      workouts: "すべてのワークアウト記録",
      agreement:
        "削除されたデータは復元できないことを確認し、退会に同意します。",
      submit: "アカウントを完全に削除",
      submitting: "退会処理中…",
    },
    en: {
      title: "Delete account",
      back: "← Back to profile",
      description: "Please review the following before deleting your account.",
      warning: "The following data will be permanently deleted.",
      account: "Your account and profile",
      routines: "All saved routines",
      workouts: "All workout records",
      agreement:
        "I understand that deleted data cannot be recovered and agree to delete my account.",
      submit: "Permanently delete account",
      submitting: "Deleting account…",
    },
  }[language];

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isSubmitting || !isAgreed) {
      return;
    }

    setErrorKey(null);

    if (
      password.length < 8 ||
      password.length > 32 ||
      !/^[\x21-\x7E]+$/.test(password)
    ) {
      setErrorKey("profileDeletePasswordRejected");
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteUserAccount({
        currentPassword: password,
      });

      setPassword("");
      setUser(null);
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorKey(
        error instanceof UserRequestError
          ? error.translationKey
          : "profileDeleteFailed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <Page>
      {isSubmitting ? null : (
        <BackLink to="/profile">{copy.back}</BackLink>
      )}

      <Title>{copy.title}</Title>

      <Card>
        <Description>{copy.description}</Description>

        <Warning>
          <strong>{copy.warning}</strong>

          <ul>
            <li>{copy.account}</li>
            <li>{copy.routines}</li>
            <li>{copy.workouts}</li>
          </ul>
        </Warning>

        <Form onSubmit={handleSubmit} noValidate>
          <Field>
            <Label htmlFor="delete-account-password">
              {t("profileCurrentPassword")}
            </Label>

            <Input
              id="delete-account-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorKey(null);
              }}
              disabled={isSubmitting}
            />
          </Field>

          <Agreement>
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(event) => setIsAgreed(event.target.checked)}
              disabled={isSubmitting}
            />

            <span>{copy.agreement}</span>
          </Agreement>

          {errorKey && (
            <ErrorMessage role="alert">
              {t(errorKey)}
            </ErrorMessage>
          )}

          <DeleteButton
            type="submit"
            disabled={
              isSubmitting ||
              !isAgreed ||
              password === ""
            }
          >
            {isSubmitting ? copy.submitting : copy.submit}
          </DeleteButton>
        </Form>
      </Card>
    </Page>
  );
}

export default DeleteAccountPage;