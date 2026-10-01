"use client";

import type { ReactNode } from "react";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
}

/** A compact single-choice filter. Buttons with aria-pressed keep it simple for keyboard and screen readers. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`no-scrollbar flex h-10 min-w-0 items-center gap-1 overflow-x-auto rounded-lg bg-subtle p-1 pointer-coarse:h-11 ${className}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex h-full shrink-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-brand ${
              active ? "bg-surface text-foreground shadow-card" : "text-muted hover:text-foreground"
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-brand-soft text-brand" : "bg-border/70 text-muted"}`}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
