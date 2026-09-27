"use client";

import { localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { useEffect, useRef, useState } from "react";

const flags: Record<Locale, string> = {
  en: "https://flagcdn.com/w40/gb.png",
  fr: "https://flagcdn.com/w40/fr.png",
};

const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Francais",
};

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (next: Locale) => {
    setOpen(false);
    if (next !== locale) setLocale(next);
  };

  return (
    <div ref={ref} className="relative">
      <div className="inline-flex items-center rounded-full border border-border bg-subtle p-0.5">
        <button
          type="button"
          aria-label={t("common.language")}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={`group flex h-7 items-center gap-1.5 rounded-full bg-surface px-1.5 pr-2 text-sm font-medium text-foreground shadow-sm ring-1 ring-border outline-none transition hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/30 pointer-coarse:h-9 pointer-coarse:gap-2 pointer-coarse:px-2.5 ${
            compact ? "min-w-[4.75rem]" : "min-w-32"
          }`}
        >
          <span
            aria-hidden
            style={{ backgroundImage: `url(${flags[locale]})` }}
            className="size-5 shrink-0 rounded-full border border-black/10 bg-cover bg-center shadow-sm pointer-coarse:size-6"
          />
          <span className="min-w-0 flex-1 truncate text-left text-xs pointer-coarse:text-sm">
            {compact ? locale.toUpperCase() : localeNames[locale]}
          </span>
          <svg
            viewBox="0 0 20 20"
            className={`size-3.5 shrink-0 text-muted transition group-hover:text-foreground ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m6 8 4 4 4-4" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          role="listbox"
          aria-label={t("common.language")}
          className="absolute right-0 z-50 mt-2 w-48 animate-pop-in overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-card"
        >
          {locales.map((item) => {
            const active = item === locale;
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(item)}
                className={`flex w-full items-center gap-3 rounded-full px-2.5 py-2 text-left text-sm transition ${
                  active ? "bg-brand-soft text-brand" : "text-foreground hover:bg-subtle"
                }`}
              >
                <span
                  aria-hidden
                  style={{ backgroundImage: `url(${flags[item]})` }}
                  className="size-6 shrink-0 rounded-full border border-black/10 bg-cover bg-center shadow-sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{localeLabels[item]}</span>
                  <span className="block text-xs text-muted">{item.toUpperCase()}</span>
                </span>
                {active && (
                  <svg viewBox="0 0 20 20" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 10 3 3 7-7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
