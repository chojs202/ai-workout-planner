import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../i18n/translations";
import type { TranslationKey } from "../i18n/translations";

export function useTranslation() {
  const { language, setLanguage } = useLanguage();

  function t(key: TranslationKey): string {
    return translations[language][key];
  }

  return { t, language, setLanguage };
}