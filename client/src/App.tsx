import { lazy, Suspense, useSyncExternalStore } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import BottomNav from "./components/layout/BottomNav";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ScrollToTop from "./components/layout/ScrollToTop";
import AppHeader from "./components/layout/AppHeader";
import styled from "styled-components";
import LoadingScreen from "./components/layout/LoadingScreen";
import { useTranslation } from "./hooks/useTranslation";
import {
  getRequestLoading,
  subscribeRequestLoading,
} from "./utils/requestLoading";
import ScrollTopButton from "./components/layout/ScrollTopButton";
import SuccessToast from "./components/common/SuccessToast";

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

const RequestLoadingCard = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 90;
  transform: translate(-50%, -50%);
  width: min(calc(100% - 48px), 280px);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: 0 12px 36px rgb(0 0 0 / 25%);
  pointer-events: none;

  > div {
    min-height: 140px;
    padding: 24px;
    background: var(--color-surface);
  }
`;

function App() {
  const { pathname } = useLocation();
  const { user, isAuthLoading, authErrorMessage } = useAuth();

  const { language } = useTranslation();

  const isRequestLoading = useSyncExternalStore(
    subscribeRequestLoading,
    getRequestLoading,
    () => false,
  );

  const loadingMessage = {
    ko: "불러오는 중…",
    ja: "読み込み中…",
    en: "Loading…",
  }[language];

  if (isAuthLoading) {
    return <LoadingScreen splash />;
  }

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
        <Suspense fallback={<LoadingScreen message={loadingMessage} />}>
          <Routes>
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={<Navigate to={user ? "/calendar" : "/login"} replace />}
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
              path="/profile/delete"
              element={
                <ProtectedRoute>
                  <DeleteAccountPage />
                </ProtectedRoute>
              }
            />
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/logout" element={<LogoutPage />} />
          </Routes>
        </Suspense>
      </div>

      {showBottomNav && <BottomNav />}
      <SuccessToast hasBottomNav={showBottomNav} />
      {isRequestLoading && (
        <RequestLoadingCard>
          <LoadingScreen message={loadingMessage} />
        </RequestLoadingCard>
      )}
    </>
  );
}

export default App;
