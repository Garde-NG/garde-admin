import en from "./messages/en.json";
import fr from "./messages/fr.json";

export const LOCALE_COOKIE = "garde-locale";

export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "Francais",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return defaultLocale;
  const [language] = value.toLowerCase().split("-");
  return isLocale(language) ? language : defaultLocale;
}

export const dictionaries = { en, fr } as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function dictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale];
}
