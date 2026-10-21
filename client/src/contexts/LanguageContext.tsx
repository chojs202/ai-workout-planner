import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Language = "ko" | "ja" | "en";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LANGUAGE_STORAGE_KEY = "ai-workout-language";

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function isLanguage(value: unknown): value is Language {
  return value === "ko" || value === "ja" || value === "en";
}

function getInitialLanguage(): Language {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    return isLanguage(savedLanguage) ? savedLanguage : "ko";
  } catch {
    return "ko";
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;

    const fontHref =
      language === "ja"
        ? "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-jp-dynamic-subset.min.css"
        : "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css";

    let fontLink = document.querySelector<HTMLLinkElement>(
      "#fit-plan-language-font",
    );

    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "fit-plan-language-font";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }

    if (fontLink.getAttribute("href") !== fontHref) {
      fontLink.href = fontHref;
    }

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // 저장할 수 없어도 현재 화면의 언어 변경은 유지합니다.
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage는 LanguageProvider 내부에서 사용해야 합니다.");
  }

  return context;
}
