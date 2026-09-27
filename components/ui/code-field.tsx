"use client";

import { useId } from "react";

interface CodeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function CodeField({
  label,
  value,
  onChange,
  onComplete,
  length = 6,
  error,
  disabled,
  autoFocus,
}: CodeFieldProps) {
  const id = useId();
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  function setNext(raw: string) {
    const next = raw.replace(/\D/g, "").slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => setNext(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
        />
        <div
          aria-hidden
          className={`pointer-events-none grid h-14 grid-cols-6 gap-2 ${disabled ? "opacity-60" : ""}`}
        >
          {digits.map((digit, index) => (
            <span
              key={index}
              className={`flex min-w-0 items-center justify-center rounded-lg border bg-surface font-mono text-xl font-semibold transition ${
                error ? "border-danger" : value.length === index ? "border-brand ring-3 ring-brand/20" : "border-input"
              }`}
            >
              {digit || <span className="size-1.5 rounded-full bg-muted/35" />}
            </span>
          ))}
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
