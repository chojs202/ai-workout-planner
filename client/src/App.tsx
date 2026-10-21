import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "./contexts/AuthContext";
import { useTranslation } from "./hooks/useTranslation";
import { usePageLoading } from "./hooks/usePageLoading";
import BottomNav from "./components/layout/BottomNav";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ScrollToTop from "./components/layout/ScrollToTop";
import AppHeader from "./components/layout/AppHeader";
import LoadingScreen from "./components/layout/LoadingScreen";
import ScrollTopButton from "./components/layout/ScrollTopButton";
import SuccessToast from "./components/common/SuccessToast";
import {
  getRequestLoading,
  subscribeRequestLoading,
} from "./utils/requestLoading";
import PageTitle from "./components/layout/PageTitle";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const MyRoutinesPage = lazy(() => import("./pages/MyRoutinesPage"));
const CreateRoutinePage = lazy(() => import("./pages/CreateRoutinePage"));
const RoutineDetailPage = lazy(() => import("./pages/RoutineDetailPage"));
const EditRoutinePage = lazy(() => import("./pages/EditRoutinePage"));
const AiRoutinePage = lazy(() => import("./pages/AiRoutinePage"));
const WorkoutPage = lazy(() => import("./pages/WorkoutPage"));
const WorkoutHistoryPage = lazy(() => import("./pages/WorkoutHistoryPage"));
const WorkoutCalendarPage = lazy(() => import("./pages/WorkoutCalendarPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const DeleteAccountPage = lazy(() => import("./pages/DeleteAccountPage"));
const LogoutPage = lazy(() => import("./pages/LogoutPage"));
const PasswordResetPage = lazy(() => import("./pages/PasswordResetPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 50%;
  z-index: 1000;

  display: grid;
  place-items: center;

  width: 100%;
  max-width: var(--app-max-width);

  background: var(--color-background);
  transform: translateX(-50%);
`;

function PageLoadingTracker() {
  usePageLoading(true);

  return null;
}

function App() {
  const { pathname } = useLocation();
  const { user, isAuthLoading, authErrorMessage } = useAuth();
  const { language } = useTranslation();

  usePageLoading(isAuthLoading);

  const isRequestLoading = useSyncExternalStore(
    subscribeRequestLoading,
    getRequestLoading,
    () => false,
  );

  const [hasBootScreen, setHasBootScreen] = useState(
    () => document.getElementById("boot-screen") !== null,
  );

  const isLoading = isAuthLoading || isRequestLoading;

  useEffect(() => {
    if (isAuthLoading || getRequestLoading()) {
      return;
    }

    // 페이지 준비가 끝나면 HTML의 최초 로딩을 제거합니다.
    document.getElementById("boot-screen")?.remove();
    setHasBootScreen(false);

    try {
      sessionStorage.setItem("fit-plan:splash-seen", "true");
    } catch {
      // 저장소를 사용할 수 없어도 앱은 계속 실행합니다.
    }
  }, [isAuthLoading, isRequestLoading]);

  const loadingMessage = {
    ko: "불러오는 중…",
    ja: "読み込み中…",
    en: "Loading…",
  }[language];

  const showBottomNav =
    user !== null &&
    !isAuthLoading &&
    authErrorMessage === "" &&
    pathname !== "/login" &&
    pathname !== "/signup" &&
    pathname !== "/logout" &&
    pathname !== "/password-reset" &&
    pathname !== "/";

  return (
    <>
      <PageTitle />

      <div inert={isLoading || hasBootScreen}>
        <ScrollToTop />

        {showBottomNav && <AppHeader />}

        <ScrollTopButton hasBottomNav={showBottomNav} />

        <div
          style={{
            paddingBottom: showBottomNav
              ? "calc(88px + env(safe-area-inset-bottom, 0px))"
              : undefined,
          }}
        >
          <Suspense fallback={<PageLoadingTracker />}>
            {!isAuthLoading && (
              <Routes>
                <Route
                  path="/"
                  element={
                    <Navigate to={user ? "/calendar" : "/login"} replace />
                  }
                />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                <Route
                  path="/routines"
                  element={
                    <ProtectedRoute>
                      <MyRoutinesPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard"
                  element={<Navigate to="/routines" replace />}
                />

                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <WorkoutCalendarPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/routines/new"
                  element={
                    <ProtectedRoute>
                      <CreateRoutinePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/routines/:routineId"
                  element={
                    <ProtectedRoute>
                      <RoutineDetailPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/routines/:routineId/edit"
                  element={
                    <ProtectedRoute>
                      <EditRoutinePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/routines/ai"
                  element={
                    <ProtectedRoute>
                      <AiRoutinePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/workouts"
                  element={
                    <ProtectedRoute>
                      <WorkoutHistoryPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/workouts/:workoutId"
                  element={
                    <ProtectedRoute>
                      <WorkoutPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile/delete"
                  element={
                    <ProtectedRoute>
                      <DeleteAccountPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="/password-reset" element={<PasswordResetPage />} />

                <Route path="/logout" element={<LogoutPage />} />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            )}
          </Suspense>
        </div>

        {showBottomNav && <BottomNav />}

        <SuccessToast hasBottomNav={showBottomNav} />
      </div>

      {isLoading && !hasBootScreen && (
        <LoadingOverlay>
          <LoadingScreen message={loadingMessage} />
        </LoadingOverlay>
      )}
    </>
  );
}

export default App;
