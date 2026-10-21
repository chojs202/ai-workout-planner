import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useTranslation } from "../../hooks/useTranslation";
import type { Language } from "../../contexts/LanguageContext";

interface PageTitleRoute {
  path: string;
  titles: Record<Language, string>;
}

const pageTitleRoutes: PageTitleRoute[] = [
  {
    path: "/login",
    titles: { ko: "로그인", ja: "ログイン", en: "Log in" },
  },
  {
    path: "/signup",
    titles: { ko: "회원가입", ja: "新規登録", en: "Sign up" },
  },
  {
    path: "/password-reset",
    titles: {
      ko: "비밀번호 재설정",
      ja: "パスワード再設定",
      en: "Reset password",
    },
  },
  {
    path: "/calendar",
    titles: {
      ko: "운동 캘린더",
      ja: "トレーニングカレンダー",
      en: "Workout calendar",
    },
  },
  {
    path: "/routines",
    titles: {
      ko: "나의 루틴",
      ja: "マイルーティン",
      en: "My routines",
    },
  },
  {
    path: "/dashboard",
    titles: {
      ko: "나의 루틴",
      ja: "マイルーティン",
      en: "My routines",
    },
  },
  {
    path: "/routines/new",
    titles: {
      ko: "루틴 만들기",
      ja: "ルーティン作成",
      en: "Create routine",
    },
  },
  {
    path: "/routines/ai",
    titles: {
      ko: "AI 루틴 추천",
      ja: "AIルーティン提案",
      en: "AI routine suggestions",
    },
  },
  {
    path: "/routines/:routineId/edit",
    titles: {
      ko: "루틴 수정",
      ja: "ルーティン編集",
      en: "Edit routine",
    },
  },
  {
    path: "/routines/:routineId",
    titles: {
      ko: "루틴 상세",
      ja: "ルーティン詳細",
      en: "Routine details",
    },
  },
  {
    path: "/workouts",
    titles: {
      ko: "운동 기록",
      ja: "トレーニング履歴",
      en: "Workout history",
    },
  },
  {
    path: "/workouts/:workoutId",
    titles: {
      ko: "운동 상세",
      ja: "トレーニング詳細",
      en: "Workout details",
    },
  },
  {
    path: "/profile",
    titles: {
      ko: "회원정보",
      ja: "アカウント情報",
      en: "Account",
    },
  },
  {
    path: "/profile/delete",
    titles: {
      ko: "회원탈퇴",
      ja: "アカウント削除",
      en: "Delete account",
    },
  },
  {
    path: "/logout",
    titles: {
      ko: "로그아웃",
      ja: "ログアウト",
      en: "Log out",
    },
  },
  {
    path: "/about",
    titles: {
      ko: "서비스 소개",
      ja: "サービス紹介",
      en: "About",
    },
  },
];

function PageTitle() {
  const { pathname } = useLocation();
  const { language } = useTranslation();

  useEffect(() => {
    const matchedRoute = pageTitleRoutes.find((route) =>
      matchPath({ path: route.path, end: true }, pathname),
    );

    const notFoundTitle = {
      ko: "페이지를 찾을 수 없습니다",
      ja: "ページが見つかりません",
      en: "Page not found",
    }[language];

    document.title = matchedRoute
      ? `${matchedRoute.titles[language]} · Fit Plan`
      : pathname === "/"
        ? "Fit Plan — AI Workout Planner & Tracker"
        : `${notFoundTitle} · Fit Plan`;
  }, [pathname, language]);

  return null;
}

export default PageTitle;
