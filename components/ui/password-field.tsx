"use client";

import { useState, type InputHTMLAttributes } from "react";

import { Field } from "./field";
import { useI18n } from "@/lib/i18n/provider";

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  label: string;
  error?: string;
  hint?: string;
  /** Show a live strength meter (for fields where the user *sets* a password). */
  showStrength?: boolean;
}

const LEVEL_COLORS = ["bg-danger", "bg-danger", "bg-amber-500", "bg-brand", "bg-brand"] as const;

/** Visual guidance only; enforce password rules from the future API contract. */
function strength(password: string): number {
  if (password.length < 8) return 0;
  let score = 1;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

export function PasswordField({ showStrength, ...props }: PasswordFieldProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const value = typeof props.value === "string" ? props.value : "";
  const level = strength(value);
  const labels = [t("auth.strengthTooShort"), t("auth.strengthWeak"), t("auth.strengthFair"), t("auth.strengthGood"), t("auth.strengthStrong")];

  return (
    <Field
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition hover:text-foreground pointer-coarse:py-2.5 pointer-coarse:text-sm"
        >
          {visible ? t("auth.hidePassword") : t("auth.showPassword")}
        </button>
      }
      footer={
        showStrength && value ? (
          <div className="flex items-center gap-2 pt-0.5" aria-live="polite">
            <div className="flex flex-1 gap-1" aria-hidden>
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    step <= level ? LEVEL_COLORS[level] : "bg-border"
                  }`}
                />
              ))}
            </div>
            <span className="w-16 text-right text-xs text-muted">{labels[level]}</span>
          </div>
        ) : undefined
      }
    />
  );
}
