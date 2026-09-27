"use client";

import { localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={locale}
        aria-label={t("common.language")}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className={`h-10 rounded-lg border border-border bg-surface text-sm font-medium text-foreground outline-none transition hover:border-brand focus:border-brand focus:ring-3 focus:ring-brand/20 ${
          compact ? "w-[5.75rem] px-2" : "px-3"
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
