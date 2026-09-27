"use client";

import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  hideLabel?: boolean;
  children: ReactNode;
}

export function Select({ label, hideLabel = false, className = "", children, ...props }: SelectProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={`block text-sm font-medium ${hideLabel ? "sr-only" : ""}`}>
        {label}
      </label>
      <select
        id={id}
        className={`h-10 w-full min-w-0 rounded-lg border border-input bg-surface px-3 text-sm outline-none transition pointer-coarse:h-11 pointer-coarse:text-base focus:border-brand focus:ring-3 focus:ring-brand/20 disabled:opacity-60 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
