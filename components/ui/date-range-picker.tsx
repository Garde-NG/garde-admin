"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import type { MessagePath } from "@/lib/i18n/provider";

export function lagosToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

function addDays(dateText: string, days: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return date.toISOString().slice(0, 10);
}

function monthStart(dateText: string) {
  return `${dateText.slice(0, 8)}01`;
}

const MONTH_KEYS = [
  "dateRangePicker.monthJanuary",
  "dateRangePicker.monthFebruary",
  "dateRangePicker.monthMarch",
  "dateRangePicker.monthApril",
  "dateRangePicker.monthMay",
  "dateRangePicker.monthJune",
  "dateRangePicker.monthJuly",
  "dateRangePicker.monthAugust",
  "dateRangePicker.monthSeptember",
  "dateRangePicker.monthOctober",
  "dateRangePicker.monthNovember",
  "dateRangePicker.monthDecember",
] as const satisfies readonly MessagePath[];

const WEEKDAY_KEYS = [
  "dateRangePicker.weekdaySun",
  "dateRangePicker.weekdayMon",
  "dateRangePicker.weekdayTue",
  "dateRangePicker.weekdayWed",
  "dateRangePicker.weekdayThu",
  "dateRangePicker.weekdayFri",
  "dateRangePicker.weekdaySat",
] as const satisfies readonly MessagePath[];

function monthLabel(month: string, t: (path: MessagePath) => string) {
  const [year, value] = month.split("-").map(Number);
  return `${t(MONTH_KEYS[value - 1])} ${year}`;
}

function daysInMonth(month: string) {
  const [year, value] = month.split("-").map(Number);
  return new Date(Date.UTC(year, value, 0)).getUTCDate();
}

function weekdayOffset(month: string) {
  const [year, value] = month.split("-").map(Number);
  return new Date(Date.UTC(year, value - 1, 1)).getUTCDay();
}

function shiftMonth(month: string, delta: number) {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, value - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

export function dateLabel(date: string, locale = "en") {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function rangeLabel(from: string, to: string, t: (path: MessagePath) => string, locale: string) {
  if (!from && !to) return t("dateRangePicker.allTime");
  if (from && to && from === to) return dateLabel(from, locale);
  if (from && to) return `${dateLabel(from, locale)} ${t("dateRangePicker.to")} ${dateLabel(to, locale)}`;
  if (from) return `${t("dateRangePicker.from")} ${dateLabel(from, locale)}`;
  return `${t("dateRangePicker.until")} ${dateLabel(to, locale)}`;
}

type Preset = "today" | "yesterday" | "7" | "month" | "all";

const PRESETS: Array<[Preset, MessagePath]> = [
  ["today", "dateRangePicker.today"],
  ["yesterday", "dateRangePicker.yesterday"],
  ["7", "dateRangePicker.last7Days"],
  ["month", "dateRangePicker.thisMonth"],
  ["all", "dateRangePicker.allTime"],
];

interface DateRangePickerProps {
  from: string;
  to: string;
  onApply: (range: { from: string; to: string }) => void;
  align?: "start" | "end";
  className?: string;
  compact?: boolean;
  allowAll?: boolean;
}

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
  className?: string;
}

export function DatePicker({ label, value, onChange, disabled = false, hint, className = "" }: DatePickerProps) {
  const { t, locale } = useI18n();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState((value || lagosToday()).slice(0, 7));
  const days = Array.from({ length: daysInMonth(month) }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
  const offset = weekdayOffset(month);
  const today = lagosToday();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setOpen(false);
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

  const choose = (day: string) => {
    onChange(day);
    setOpen(false);
  };

  return (
    <div ref={popoverRef} className={`relative min-w-0 space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium">{label}</label>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setMonth((value || lagosToday()).slice(0, 7));
          setOpen((current) => !current);
        }}
        className={`group flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-input bg-surface px-3 text-left text-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-3 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60 pointer-coarse:h-11 pointer-coarse:text-base ${open ? "border-brand ring-3 ring-brand/20" : ""}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4M16 2v4M4 10h16" />
            <rect x="4" y="4" width="16" height="18" rx="2" />
          </svg>
          <span className={`truncate ${value ? "font-medium" : "text-muted"}`}>{value ? dateLabel(value, locale) : t("dateRangePicker.selectDate")}</span>
        </span>
        <svg viewBox="0 0 24 24" className={`size-4 shrink-0 text-muted transition group-hover:text-foreground ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {hint && <p className="text-xs text-muted">{hint}</p>}

      {open && (
        <div role="dialog" aria-label={label} className="fixed inset-x-2 top-1/2 z-50 mx-auto max-h-[calc(100dvh-1rem)] w-auto max-w-96 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface p-3 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-foreground" aria-label={t("dateRangePicker.previousMonth")}>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <p className="font-semibold">{monthLabel(month, t)}</p>
            <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-foreground" aria-label={t("dateRangePicker.nextMonth")}>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
            {WEEKDAY_KEYS.map((key) => <span key={key}>{t(key)}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: offset }).map((_, index) => <span key={`single-blank-${index}`} />)}
            {days.map((day) => {
              const selected = day === value;
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected}
                  aria-label={dateLabel(day, locale)}
                  onClick={() => choose(day)}
                  className={`h-9 rounded-lg text-sm font-medium transition ${
                    selected ? "bg-brand text-brand-foreground" : day === today ? "bg-subtle text-foreground" : "hover:bg-subtle"
                  }`}
                >
                  {Number(day.slice(-2))}
                </button>
              );
            })}
          </div>
          {value && (
            <div className="mt-3 flex justify-end border-t border-border pt-3">
              <Button variant="secondary" onClick={() => choose("")}>{t("dateRangePicker.clearDate")}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DateRangePicker({ from, to, onApply, className = "", compact = false, allowAll = true }: DateRangePickerProps) {
  const { t, locale } = useI18n();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [month, setMonth] = useState((from || lagosToday()).slice(0, 7));
  const days = Array.from({ length: daysInMonth(month) }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
  const offset = weekdayOffset(month);
  const today = lagosToday();

  const pick = (day: string) => {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(day);
      setDraftTo("");
    } else if (day < draftFrom) {
      setDraftFrom(day);
      setDraftTo(draftFrom);
    } else {
      setDraftTo(day);
    }
  };

  const setPreset = (preset: Preset) => {
    if (preset === "all") {
      setDraftFrom("");
      setDraftTo("");
      return;
    }
    if (preset === "today") {
      setDraftFrom(today);
      setDraftTo(today);
      setMonth(today.slice(0, 7));
      return;
    }
    if (preset === "yesterday") {
      const yesterday = addDays(today, -1);
      setDraftFrom(yesterday);
      setDraftTo(yesterday);
      setMonth(yesterday.slice(0, 7));
      return;
    }
    if (preset === "7") {
      setDraftFrom(addDays(today, -6));
      setDraftTo(today);
      setMonth(today.slice(0, 7));
      return;
    }
    setDraftFrom(monthStart(today));
    setDraftTo(today);
    setMonth(today.slice(0, 7));
  };

  const apply = () => {
    onApply({ from: draftFrom, to: draftTo || draftFrom });
    setOpen(false);
  };
  const presets = allowAll ? PRESETS : PRESETS.filter(([id]) => id !== "all");
  const canApply = allowAll || Boolean(draftFrom);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setOpen(false);
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

  return (
    <div ref={popoverRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setDraftFrom(from);
          setDraftTo(to);
          setMonth((from || lagosToday()).slice(0, 7));
          setOpen((value) => !value);
        }}
        className={`group flex w-full items-center justify-between gap-3 border border-border bg-surface text-left text-sm transition hover:border-brand/50 hover:bg-subtle focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/20 ${
          compact ? "h-10 rounded-lg px-3 pointer-coarse:h-11 pointer-coarse:text-base" : "h-12 rounded-xl px-3 shadow-card pointer-coarse:text-base"
        } ${open ? "border-brand ring-3 ring-brand/20" : ""}`}
      >
        {compact ? (
          <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4M16 2v4M4 10h16" />
            <rect x="4" y="4" width="16" height="18" rx="2" />
          </svg>
        ) : (
          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v4M16 2v4M4 10h16" />
              <rect x="4" y="4" width="16" height="18" rx="2" />
            </svg>
          </span>
        )}
        <span className="min-w-0 flex-1">
          {!compact && <span className="block text-[0.7rem] font-semibold uppercase tracking-wide text-muted">{t("dateRangePicker.dateRange")}</span>}
          <span className={`block truncate ${compact ? "font-medium" : "font-semibold"}`}>
            {compact && <span className="sr-only">{t("dateRangePicker.dateRangePrefix")}</span>}
            {rangeLabel(from, to, t, locale)}
          </span>
        </span>
        <span aria-hidden className={`flex shrink-0 items-center justify-center text-muted transition group-hover:text-foreground ${compact ? "" : "size-8 rounded-lg group-hover:bg-surface"}`}>
          <svg viewBox="0 0 24 24" className={`size-4 transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div role="dialog" aria-label={t("dateRangePicker.chooseDateRange")} className="fixed inset-x-2 top-1/2 z-50 mx-auto max-h-[calc(100dvh-1rem)] w-auto max-w-2xl -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface shadow-card">
          <div className="grid gap-0 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="border-b border-border bg-subtle/50 p-3 sm:border-b-0 sm:border-r">
              <p className="px-1 text-xs font-semibold uppercase text-muted">{t("dateRangePicker.quickRanges")}</p>
              <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-1">
                {presets.map(([id, labelKey]) => (
                  <button key={id} type="button" onClick={() => setPreset(id)} className="rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-surface">
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-foreground" aria-label={t("dateRangePicker.previousMonth")}>
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <p className="font-semibold">{monthLabel(month, t)}</p>
                <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-foreground" aria-label={t("dateRangePicker.nextMonth")}>
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
                {WEEKDAY_KEYS.map((key) => <span key={key}>{t(key)}</span>)}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: offset }).map((_, index) => <span key={`blank-${index}`} />)}
                {days.map((day) => {
                  const selected = day === draftFrom || day === draftTo;
                  const ranged = draftFrom && draftTo && day > draftFrom && day < draftTo;
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={selected}
                      aria-label={dateLabel(day, locale)}
                      onClick={() => pick(day)}
                      className={`h-9 rounded-lg text-sm font-medium transition ${
                        selected ? "bg-brand text-brand-foreground" : ranged ? "bg-brand-soft text-brand" : day === today ? "bg-subtle text-foreground" : "hover:bg-subtle"
                      }`}
                    >
                      {Number(day.slice(-2))}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted">{rangeLabel(draftFrom, draftTo, t, locale)}</p>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button variant="secondary" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                  <Button onClick={apply} disabled={!canApply}>{t("dateRangePicker.apply")}</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
