"use client";

import { localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";

const flags: Record<Locale, string> = {
  en: "https://flagcdn.com/w40/gb.png",
  fr: "https://flagcdn.com/w40/fr.png",
};

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="relative flex items-center gap-2 text-sm text-muted">
      <span className="sr-only">{t("common.language")}</span>
      <span
        aria-hidden
        style={{ backgroundImage: `url(${flags[locale]})` }}
        className="pointer-events-none absolute left-2.5 z-10 h-3.5 w-5 rounded-[2px] bg-cover bg-center shadow-sm"
      />
      <select
        value={locale}
        aria-label={t("common.language")}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className={`h-10 rounded-lg border border-border bg-surface text-sm font-medium text-foreground outline-none transition hover:border-brand focus:border-brand focus:ring-3 focus:ring-brand/20 ${
          compact ? "w-[6.4rem] pl-9 pr-2" : "pl-9 pr-3"
        }`}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {compact ? item.toUpperCase() : localeLabels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
