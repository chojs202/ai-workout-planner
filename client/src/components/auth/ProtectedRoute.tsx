import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthLoading, authErrorMessage } = useAuth();

  // 인증 확인 중에는 App의 공통 로딩 화면을 사용합니다.
  if (isAuthLoading) {
    return null;
  }

  // 연결 오류 안내와 재시도는 로그인 페이지에서 표시합니다.
  if (authErrorMessage || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
