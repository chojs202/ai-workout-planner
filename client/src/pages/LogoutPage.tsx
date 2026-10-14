import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import { AuthRequestError } from "../api/auth";
import type { TranslationKey } from "../i18n/translations";
import LoadingScreen from "../components/layout/LoadingScreen";
import CommonModal, {
  ModalActions,
  ModalButton,
} from "../components/common/CommonModal";

function LogoutPage() {
  const { user, logoutUser } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const logoutRef = useRef(logoutUser);
  const userRef = useRef(user);
  const requestRef = useRef<{
    attempt: number;
    promise: Promise<void>;
  } | null>(null);
  logoutRef.current = logoutUser;
  userRef.current = user;

  const copy = {
    ko: {
      title: "로그아웃하지 못했습니다",
      back: "회원정보로 돌아가기",
    },
    ja: {
      title: "ログアウトできませんでした",
      back: "会員情報に戻る",
    },
    en: {
      title: "Unable to log out",
      back: "Back to profile",
    },
  }[language];

  useEffect(() => {
    let isActive = true;

    if (!userRef.current && requestRef.current === null) {
      navigate("/login", { replace: true });
      return;
    }

    setIsLoggingOut(true);
    setErrorKey(null);

    // StrictMode가 effect를 다시 실행해도 같은 시도의 요청은 재사용합니다.
    if (requestRef.current?.attempt !== attempt) {
      requestRef.current = {
        attempt,
        promise: Promise.resolve().then(() => logoutRef.current()),
      };
    }

    void requestRef.current.promise
      .then(() => {
        if (isActive) {
          navigate("/login", { replace: true });
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorKey(
            error instanceof AuthRequestError
              ? error.translationKey
              : "profileLogoutFailed",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoggingOut(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [attempt, navigate]);

  function handleReturnToProfile(): void {
    if (!isLoggingOut) {
      navigate("/profile", { replace: true });
    }
  }

  return (
    <>
      {!errorKey && <LoadingScreen message={t("profileLoggingOut")} />}
      {errorKey && (
        <CommonModal
          title={copy.title}
          error={t(errorKey)}
          isBusy={isLoggingOut}
          onClose={handleReturnToProfile}
          actions={
            <ModalActions>
              <ModalButton
                type="button"
                autoFocus
                disabled={isLoggingOut}
                onClick={handleReturnToProfile}
              >
                {copy.back}
              </ModalButton>
              <ModalButton
                type="button"
                $tone="primary"
                disabled={isLoggingOut}
                onClick={() => {
                  if (isLoggingOut) return;
                  setIsLoggingOut(true);
                  setAttempt((value) => value + 1);
                }}
              >
                {t("retry")}
              </ModalButton>
            </ModalActions>
          }
        />
      )}
    </>
  );
}

export default LogoutPage;
