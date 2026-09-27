"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { dictionaryFor, isLocale, LOCALE_COOKIE, type Dictionary, type Locale } from "./config";
import { localizedPath, replacePathLocale } from "./routing";

type Section = keyof Dictionary;
type MessageKey<S extends Section> = keyof Dictionary[S] & string;
export type MessagePath = { [S in Section]: `${S}.${MessageKey<S>}` }[Section];

interface I18nContextValue {
  locale: Locale;
  dictionary: Dictionary;
  href: (path: string) => string;
  setLocale: (locale: Locale) => void;
  t: (path: MessagePath) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function read(path: MessagePath, dictionary: Dictionary): string {
  const [section, key] = path.split(".") as [Section, string];
  const value = (dictionary[section] as Record<string, string>)[key];
  return value ?? path;
}

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocaleState] = useState(initialLocale);
  const dictionary = dictionaryFor(locale);

  useEffect(() => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocale(next)) return;
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      router.replace(replacePathLocale(pathname, next));
      router.refresh();
    },
    [pathname, router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, dictionary, href: (path) => localizedPath(path, locale), setLocale, t: (path) => read(path, dictionary) }),
    [dictionary, locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <LanguageProvider>.");
  return context;
}
