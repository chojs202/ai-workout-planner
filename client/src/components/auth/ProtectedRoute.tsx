import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import LoadingScreen from "../layout/LoadingScreen";

const StatusPage = styled.main`
  display: grid;
  place-items: center;

  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--section-gap) var(--page-padding);

  color: var(--color-text);
  background: var(--color-background);
`;

const StatusCard = styled.section`
  width: 100%;
  min-width: 0;
  max-width: 420px;
  padding: var(--card-padding);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  text-align: center;
`;

const StatusTitle = styled.h1`
  margin-bottom: 16px;

  color: var(--color-text);
  font-size: var(--font-section-title);
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const ErrorMessage = styled.p`
  margin-bottom: 24px;
  padding: 12px;

  color: var(--color-error);
  background: rgb(255 133 133 / 8%);
  border: 1px solid rgb(255 133 133 / 25%);
  border-radius: var(--radius-control);

  font-size: var(--font-caption);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const RetryButton = styled.button`
  width: 100%;
  min-height: var(--control-min-height);
  padding: 10px 16px;

  color: var(--color-on-primary);
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-control);

  font-size: var(--font-body);
  font-weight: 700;
  line-height: 1.5;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation();

  const { user, isAuthLoading, authErrorMessage, retryAuth } = useAuth();

  if (isAuthLoading) {
    return <LoadingScreen splash />;
  }

  if (authErrorMessage) {
    return (
      <StatusPage>
        <StatusCard>
          <StatusTitle>{t("authCheckFailedTitle")}</StatusTitle>

          <ErrorMessage role="alert">{authErrorMessage}</ErrorMessage>

          <RetryButton
            type="button"
            onClick={() => {
              void retryAuth();
            }}
            disabled={isAuthLoading}
          >
            {t("retry")}
          </RetryButton>
        </StatusCard>
      </StatusPage>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
