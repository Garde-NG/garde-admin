"use client";

import { useId, type ReactNode, type TextareaHTMLAttributes } from "react";

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Shows "used / max" under the box when maxLength is set. */
  showCount?: boolean;
}

export function TextArea({ label, error, hint, showCount = false, className = "", maxLength, value, ...props }: TextAreaProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const length = typeof value === "string" ? value.length : 0;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`block min-h-24 w-full min-w-0 resize-y rounded-lg border bg-surface px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/60 pointer-coarse:text-base focus:border-brand focus:ring-3 focus:ring-brand/20 disabled:opacity-60 ${
          error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-input"
        } ${className}`}
        {...props}
      />
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} className="text-xs text-danger">{error}</p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>
        ) : <span />}
        {showCount && maxLength && (
          <p aria-hidden className={`shrink-0 text-xs tabular-nums ${length >= maxLength ? "text-danger" : "text-muted"}`}>
            {length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
