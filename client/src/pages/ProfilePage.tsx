import { useEffect, useRef, useState } from "react";
import { Link, useBlocker, useNavigate } from "react-router-dom";
import styled from "styled-components";
import CommonModal, {
  ModalActions,
  ModalButton,
} from "../components/common/CommonModal";
import { useAuth } from "../contexts/AuthContext";
import type { FormEvent } from "react";
import { updateUserProfile, UserRequestError } from "../api/users";
import type { UpdateUserProfileRequest } from "../types/user";
import { useTranslation } from "../hooks/useTranslation";
import { AuthRequestError } from "../api/auth";
import type { TranslationKey } from "../i18n/translations";
import { showSuccessToast } from "../utils/successToast";

const Page = styled.main`
  min-height: 100dvh;
  padding: var(--section-gap) var(--page-padding);
  color: var(--color-text);
  background: var(--color-background);
`;
const Container = styled.div`
  width: 100%;
  min-width: 0;
  max-width: var(--app-max-width);
  margin: 0 auto;
`;
const Title = styled.h1`
  margin-bottom: var(--section-gap);
  color: var(--color-text);
  font-size: var(--font-page-title);
  font-weight: 700;
  line-height: 1.3;
`;
const Card = styled.section`
  min-width: 0;
  padding: var(--card-padding);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
`;
const Label = styled.h2`
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
`;
const Email = styled.p`
  color: var(--color-text);
  font-size: var(--font-body);
  font-weight: 500;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: var(--section-gap);
  padding-top: var(--section-gap);
  border-top: 1px solid var(--color-border);
`;
const LogoutButton = styled.button`
  min-height: var(--control-min-height);
  padding: 10px 12px;
  color: var(--color-error);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
  &:hover:not(:disabled) {
    border-color: var(--color-error);
    background: rgb(255 133 133 / 8%);
  }
  &:focus-visible {
    outline: 2px solid var(--color-error);
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.5;
  }
`;
const ErrorMessage = styled.p`
  margin-top: 12px;
  padding: 12px;
  color: var(--color-error);
  background: rgb(255 133 133 / 8%);
  border: 1px solid rgb(255 133 133 / 25%);
  border-radius: var(--radius-control);
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;
const NameForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 16px;
  > label:not(:first-child) {
    margin-top: 9px;
  }
  > button {
    margin-top: 9px;
  }
`;
const NameLabel = styled.label`
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;
const NameInput = styled.input`
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
const NameSaveButton = styled.button`
  min-height: var(--control-min-height);
  padding: 10px 12px;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-control);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
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

const ToggleButton = styled.button`
  max-width: 100%;
  min-height: var(--control-min-height);
  margin-top: 12px;
  padding: 10px 12px;
  color: var(--color-primary);
  background: var(--color-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
  &:hover:not(:disabled) {
    border-color: var(--color-primary);
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.5;
  }
`;
const ProfileSection = styled.div`
  min-width: 0;
  & + & {
    margin-top: var(--section-gap);
    padding-top: var(--section-gap);
    border-top: 1px solid var(--color-border);
  }
`;
const EditButton = styled(NameSaveButton)`
  width: 100%;
  margin-top: var(--section-gap);
`;
const EditorActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
`;
const CancelButton = styled(ToggleButton)`
  width: 100%;
  margin-top: 0;
  color: var(--color-text-muted);
`;
const PasswordFields = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 16px;
  > label:not(:first-child) {
    margin-top: 8px;
  }
`;
const WithdrawalLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 44px;
  margin: 24px auto 0;
  padding: 8px 16px;
  color: var(--color-text-muted);
  background: transparent;
  font-size: 13px;
  line-height: 1.5;
  &:hover {
    color: var(--color-text);
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 8px;
  }
`;
function ProfilePage() {
  const { user, setUser, logoutUser } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const withdrawalLabel = {
    ko: "회원탈퇴",
    ja: "退会",
    en: "Delete account",
  }[language];
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorKey, setErrorKey] = useState<TranslationKey | "">("");
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const savingRef = useRef(false);
  const copy = {
    ko: {
      edit: "회원정보 수정",
      save: "저장",
      cancel: "취소",
    },
    ja: {
      edit: "会員情報を編集",
      save: "保存",
      cancel: "キャンセル",
    },
    en: {
      edit: "Edit profile",
      save: "Save",
      cancel: "Cancel",
    },
  }[language];
  const isBusy = isSaving || isLoggingOut;
  const hasNameChanged = name.trim() !== (user?.name ?? "").trim();
  const wantsPasswordChange =
    isPasswordFormOpen &&
    (currentPassword !== "" || newPassword !== "" || confirmPassword !== "");
  const hasChanges = hasNameChanged || wantsPasswordChange;
  const shouldBlockNavigation =
    user !== null && isEditing && (hasChanges || isSaving);
  const blocker = useBlocker(shouldBlockNavigation);
  const isNavigationConfirm = blocker.state === "blocked";
  const showCloseConfirm =
    isCloseConfirmOpen || (isNavigationConfirm && shouldBlockNavigation);
  const closeCopy = {
    ko: {
      title: "수정 내용을 저장할까요?",
      description: "저장하지 않은 회원정보 변경사항이 있습니다.",
      busy: "회원정보를 저장하고 있습니다. 잠시 기다려주세요.",
      stay: "계속 수정",
      discard: "저장하지 않고 닫기",
      leave: "저장하지 않고 이동",
      saveClose: "저장 후 닫기",
      saveLeave: "저장 후 이동",
    },
    ja: {
      title: "変更内容を保存しますか？",
      description: "会員情報に未保存の変更があります。",
      busy: "会員情報を保存しています。しばらくお待ちください。",
      stay: "編集を続ける",
      discard: "保存せずに閉じる",
      leave: "保存せずに移動",
      saveClose: "保存して閉じる",
      saveLeave: "保存して移動",
    },
    en: {
      title: "Save your changes?",
      description: "You have unsaved changes to your profile.",
      busy: "Saving your profile. Please wait.",
      stay: "Continue editing",
      discard: "Close without saving",
      leave: "Leave without saving",
      saveClose: "Save and close",
      saveLeave: "Save and leave",
    },
  }[language];

  useEffect(() => {
    if (blocker.state === "blocked" && !shouldBlockNavigation) {
      blocker.proceed();
    }
  }, [blocker, shouldBlockNavigation]);

  useEffect(() => {
    if (!shouldBlockNavigation) return;

    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldBlockNavigation]);

  function handleContinueEditing(): void {
    if (isBusy) return;
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    setIsCloseConfirmOpen(false);
  }

  function clearPasswordFields(): void {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }
  function handleStartEdit(): void {
    if (isBusy) {
      return;
    }
    setName(user?.name ?? "");
    clearPasswordFields();
    setIsPasswordFormOpen(false);
    setErrorKey("");
    setIsEditing(true);
  }
  function handleCancelEdit(): void {
    if (isBusy) return;
    if (hasChanges) {
      setIsCloseConfirmOpen(true);
      return;
    }
    handleDiscardEdit();
  }

  function handleDiscardEdit(): void {
    if (isBusy) {
      return;
    }
    setName(user?.name ?? "");
    clearPasswordFields();
    setIsPasswordFormOpen(false);
    setErrorKey("");
    setIsEditing(false);
    setIsCloseConfirmOpen(false);
  }
  function handleTogglePassword(): void {
    if (isBusy) {
      return;
    }
    clearPasswordFields();
    setErrorKey("");
    setIsPasswordFormOpen((previous) => !previous);
  }
  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await saveProfile();
  }

  async function saveProfile(): Promise<boolean> {
    if (!user || isBusy || !hasChanges || savingRef.current) {
      return false;
    }
    setErrorKey("");
    const normalizedName = name.trim();
    if (hasNameChanged) {
      if (normalizedName === "") {
        setErrorKey("profileNameRequired");
        return false;
      }
      if (normalizedName.length > 30) {
        setErrorKey("profileNameTooLong");
        return false;
      }
      if (/[\u0000-\u001F\u007F]/.test(normalizedName)) {
        setErrorKey("profileNameInvalid");
        return false;
      }
    }
    if (wantsPasswordChange) {
      if (currentPassword === "" || newPassword === "") {
        setErrorKey("profilePasswordRequired");
        return false;
      }
      if (
        currentPassword.length < 8 ||
        currentPassword.length > 32 ||
        !/^[\x21-\x7E]+$/.test(currentPassword)
      ) {
        setErrorKey("profileCurrentPasswordInvalid");
        return false;
      }
      if (newPassword.length < 8) {
        setErrorKey("passwordTooShort");
        return false;
      }
      if (newPassword.length > 32) {
        setErrorKey("passwordTooLong");
        return false;
      }
      if (!/^[\x21-\x7E]+$/.test(newPassword)) {
        setErrorKey("passwordInvalidCharacters");
        return false;
      }
      if (currentPassword === newPassword) {
        setErrorKey("profilePasswordSame");
        return false;
      }
      if (newPassword !== confirmPassword) {
        setErrorKey("profilePasswordMismatch");
        return false;
      }
    }
    const nameUpdate = hasNameChanged ? { name: normalizedName } : {};
    const requestData: UpdateUserProfileRequest = wantsPasswordChange
      ? {
          ...nameUpdate,
          currentPassword,
          newPassword,
        }
      : nameUpdate;
    savingRef.current = true;
    setIsSaving(true);
    try {
      const result = await updateUserProfile(requestData);
      setUser(result.user);
      setName(result.user.name);
      clearPasswordFields();
      setIsPasswordFormOpen(false);
      setIsEditing(false);
      showSuccessToast();
      setIsCloseConfirmOpen(false);
      return true;
    } catch (error) {
      setErrorKey(
        error instanceof UserRequestError
          ? error.translationKey
          : wantsPasswordChange
            ? "profilePasswordFailed"
            : "profileNameFailed",
      );
      return false;
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }
  async function handleLogout(): Promise<void> {
    if (isBusy) {
      return;
    }
    setErrorKey("");
    setIsLoggingOut(true);
    try {
      await logoutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorKey(
        error instanceof AuthRequestError
          ? error.translationKey
          : "profileLogoutFailed",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }
  if (!user) {
    return null;
  }
  return (
    <Page>
      <Container>
        <Title>{t("profile")}</Title>
        <Card>
          <ProfileSection>
            <Label>{t("profileEmail")}</Label>
            <Email>{user.email}</Email>
          </ProfileSection>
          <ProfileSection>
            {isEditing ? (
              <NameForm onSubmit={handleSave} noValidate>
                <NameLabel htmlFor="profile-name">{t("profileName")}</NameLabel>
                <NameInput
                  id="profile-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder={t("profileNamePlaceholder")}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setErrorKey("");
                  }}
                  disabled={isBusy}
                />
                <ToggleButton
                  type="button"
                  onClick={handleTogglePassword}
                  disabled={isBusy}
                  aria-expanded={isPasswordFormOpen}
                  aria-controls={
                    isPasswordFormOpen ? "profile-password-fields" : undefined
                  }
                >
                  {isPasswordFormOpen
                    ? t("profileCancelChange")
                    : t("profileChangePassword")}
                </ToggleButton>
                {isPasswordFormOpen && (
                  <PasswordFields id="profile-password-fields">
                    <NameLabel htmlFor="current-password">
                      {t("profileCurrentPassword")}
                    </NameLabel>
                    <NameInput
                      id="current-password"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) => {
                        setCurrentPassword(event.target.value);
                        setErrorKey("");
                      }}
                      disabled={isBusy}
                    />
                    <NameLabel htmlFor="new-password">
                      {t("profileNewPassword")}
                    </NameLabel>
                    <NameInput
                      id="new-password"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder={t("profilePasswordHint")}
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value);
                        setErrorKey("");
                      }}
                      disabled={isBusy}
                    />
                    <NameLabel htmlFor="confirm-password">
                      {t("profileConfirmPassword")}
                    </NameLabel>
                    <NameInput
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setErrorKey("");
                      }}
                      disabled={isBusy}
                    />
                  </PasswordFields>
                )}
                {errorKey && (
                  <ErrorMessage role="alert">{t(errorKey)}</ErrorMessage>
                )}
                <EditorActions>
                  <CancelButton
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isBusy}
                  >
                    {copy.cancel}
                  </CancelButton>
                  <NameSaveButton
                    type="submit"
                    disabled={isBusy || !hasChanges}
                  >
                    {isSaving ? t("profileSaving") : copy.save}
                  </NameSaveButton>
                </EditorActions>
              </NameForm>
            ) : (
              <>
                <Label>{t("profileName")}</Label>
                <Email>{user.name || t("profileNameEmpty")}</Email>
                <EditButton
                  type="button"
                  onClick={handleStartEdit}
                  disabled={isBusy}
                >
                  {copy.edit}
                </EditButton>
              </>
            )}
          </ProfileSection>

          {!isEditing && (
            <>
              <Actions>
                <LogoutButton
                  type="button"
                  onClick={() => {
                    void handleLogout();
                  }}
                  disabled={isBusy}
                >
                  {isLoggingOut ? t("profileLoggingOut") : t("profileLogout")}
                </LogoutButton>
              </Actions>
              {errorKey && (
                <ErrorMessage role="alert">{t(errorKey)}</ErrorMessage>
              )}
            </>
          )}
        </Card>
        {!isEditing && !isBusy && (
          <WithdrawalLink to="/profile/delete">
            {withdrawalLabel}
          </WithdrawalLink>
        )}
      </Container>
      {showCloseConfirm && (
        <CommonModal
          title={closeCopy.title}
          description={isSaving ? closeCopy.busy : closeCopy.description}
          error={errorKey ? t(errorKey) : undefined}
          isBusy={isBusy}
          onClose={handleContinueEditing}
          actions={
            <ModalActions $stacked>
              <ModalButton
                type="button"
                autoFocus
                disabled={isBusy}
                onClick={handleContinueEditing}
              >
                {closeCopy.stay}
              </ModalButton>
              <ModalButton
                type="button"
                $tone="danger"
                disabled={isBusy}
                onClick={handleDiscardEdit}
              >
                {isNavigationConfirm ? closeCopy.leave : closeCopy.discard}
              </ModalButton>
              <ModalButton
                type="button"
                $tone="primary"
                disabled={isBusy}
                onClick={() => void saveProfile()}
              >
                {isSaving
                  ? t("profileSaving")
                  : isNavigationConfirm
                    ? closeCopy.saveLeave
                    : closeCopy.saveClose}
              </ModalButton>
            </ModalActions>
          }
        />
      )}
    </Page>
  );
}
export default ProfilePage;
