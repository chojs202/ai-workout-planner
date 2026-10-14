import { koTranslations } from "./locales/ko";
import { jaTranslations } from "./locales/ja";
import { enTranslations } from "./locales/en";

export const translations = {
    ko: koTranslations,
    ja: jaTranslations,
    en: enTranslations,
} as const;

export type TranslationKey = keyof typeof koTranslations;