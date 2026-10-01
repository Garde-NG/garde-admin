"use client";

import type { ReactNode } from "react";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  badge?: ReactNode;
}

/** Underlined section tabs. The caller owns the state (usually a URL param). */
export function Tabs<T extends string>({ label, value, items, onChange }: { label: string; value: T; items: TabItem<T>[]; onChange: (value: T) => void }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar -mb-px flex gap-1 overflow-x-auto border-b border-border">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const index = items.findIndex((entry) => entry.value === value);
              const next = items[(index + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length];
              onChange(next.value);
              const list = event.currentTarget.parentElement;
              requestAnimationFrame(() => list?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus());
            }}
            tabIndex={active ? 0 : -1}
            className={`relative inline-flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${
              active ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
            {item.badge}
            <span aria-hidden className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full transition ${active ? "bg-brand" : "bg-transparent"}`} />
          </button>
        );
      })}
    </div>
  );
}
