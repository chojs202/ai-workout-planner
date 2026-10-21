import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AuthRequestError,
  AuthStatusError,
  getCurrentUser,
  logout as requestLogout,
} from "../api/auth";
import { AUTH_EXPIRED_EVENT } from "../api/authenticatedFetch";
import { useTranslation } from "../hooks/useTranslation";
import type { TranslationKey } from "../i18n/translations";
import type { User } from "../types/user";

interface AuthContextValue {
  user: User | null;
  isAuthLoading: boolean;
  isAuthRetrying: boolean;
  authErrorMessage: string;
  setUser: (user: User | null) => void;
  retryAuth: () => Promise<void>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { t } = useTranslation();

  const [user, setUserState] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthRetrying, setIsAuthRetrying] = useState(false);
  const [authErrorKey, setAuthErrorKey] = useState<TranslationKey | null>(null);

  const authErrorMessage = authErrorKey ? t(authErrorKey) : "";

  function setUser(nextUser: User | null): void {
    setUserState(nextUser);
    setAuthErrorKey(null);
  }

  async function checkCurrentUser(
    shouldApply: () => boolean = () => true,
    showFullScreenLoading = true,
  ): Promise<void> {
    if (!shouldApply()) {
      return;
    }

    if (showFullScreenLoading) {
      setIsAuthLoading(true);
      setAuthErrorKey(null);
    } else {
      setIsAuthRetrying(true);
    }

    try {
      const result = await getCurrentUser();

      if (shouldApply()) {
        setUserState(result.user);
        setAuthErrorKey(null);
      }
    } catch (error) {
      if (!shouldApply()) {
        return;
      }

      if (error instanceof AuthStatusError && error.status === 401) {
        setUserState(null);
        setAuthErrorKey(null);
        return;
      }

      setAuthErrorKey(
        error instanceof AuthRequestError
          ? error.translationKey
          : "authCheckFailed",
      );
    } finally {
      if (shouldApply()) {
        if (showFullScreenLoading) {
          setIsAuthLoading(false);
        } else {
          setIsAuthRetrying(false);
        }
      }
    }
  }

  useEffect(() => {
    let isMounted = true;

    void checkCurrentUser(() => isMounted);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleAuthExpired(): void {
      setUserState(null);
      setAuthErrorKey(null);
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  async function retryAuth(): Promise<void> {
    await checkCurrentUser(() => true, false);
  }

  async function logoutUser(): Promise<void> {
    await requestLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        isAuthRetrying,
        authErrorMessage,
        setUser,
        retryAuth,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth는 AuthProvider 내부에서 사용해야 합니다.");
  }

  return context;
}
