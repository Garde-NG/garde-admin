"use client";

import { useId, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/provider";

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  /** Normalises a typed value before it is validated and added (e.g. upper-casing). */
  normalize?: (value: string) => string;
  /** Returns an error message for an invalid value, or null when it can be added. */
  validate?: (value: string) => string | null;
  placeholder?: string;
  hint?: ReactNode;
  error?: string;
  mono?: boolean;
  maxItems?: number;
}

/** Type a value and press Enter or comma to add it; Backspace on an empty box removes the last chip. */
export function TagInput({ label, values, onChange, normalize = (v) => v.trim(), validate, placeholder, hint, error, mono = false, maxItems = 50 }: TagInputProps) {
  const { t } = useI18n();
  const id = useId();
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const shownError = draftError ?? error;
  const describedBy = shownError ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const commit = (raw: string) => {
    const value = normalize(raw);
    if (!value) return true;
    if (values.includes(value)) {
      setDraft("");
      setDraftError(null);
      return true;
    }
    const problem = validate?.(value) ?? null;
    if (problem) {
      setDraftError(problem);
      return false;
    }
    if (values.length >= maxItems) return false;
    onChange([...values, value]);
    setDraft("");
    setDraftError(null);
    return true;
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <div
        className={`flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-surface px-2 py-1.5 text-sm transition focus-within:ring-3 pointer-coarse:min-h-11 ${
          shownError ? "border-danger focus-within:ring-danger/20" : "border-input focus-within:border-brand focus-within:ring-brand/20"
        }`}
      >
        {values.map((value) => (
          <span key={value} className={`inline-flex max-w-full items-center gap-1 rounded-md bg-subtle py-0.5 pl-2 pr-0.5 text-xs font-medium ${mono ? "font-mono" : ""}`}>
            <span className="truncate">{value}</span>
            <button
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              aria-label={`${t("common.remove")} ${value}`}
              className="flex size-5 shrink-0 items-center justify-center rounded text-muted transition hover:bg-border hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedBy}
          placeholder={values.length === 0 ? placeholder : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            if (draftError) setDraftError(null);
          }}
          onKeyDown={(event) => {
            // Tab is left alone: onBlur commits the draft as focus moves on.
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commit(draft);
            } else if (event.key === "Backspace" && !draft && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && commit(draft)}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (!/[,\n]/.test(text)) return;
            event.preventDefault();
            const next = [...values];
            for (const part of text.split(/[,\n]/)) {
              const value = normalize(part);
              if (value && !next.includes(value) && !(validate?.(value))) next.push(value);
            }
            onChange(next.slice(0, maxItems));
          }}
          className={`h-7 min-w-24 flex-1 bg-transparent px-1 outline-none placeholder:text-muted/60 pointer-coarse:text-base ${mono ? "font-mono" : ""}`}
        />
      </div>
      {shownError ? (
        <p id={`${id}-error`} className="text-xs text-danger">{shownError}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
