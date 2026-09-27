"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-range-picker";
import { useI18n } from "@/lib/i18n/provider";
import { locales, localeLabels, type Locale } from "@/lib/i18n/config";
import type { LegalDocumentType, LegalTranslation } from "@/lib/legal/types";

export interface LegalEditorState {
  document_type: LegalDocumentType;
  version: string;
  effective_date: string;
  translations: LegalTranslation[];
}

function emptyTranslations(): LegalTranslation[] {
  return locales.map((locale) => ({ locale, title: "", content: "" }));
}

export function initialEditorState(existing?: { document_type: string; version: string; effective_date: string | null; translations: LegalTranslation[] }): LegalEditorState {
  if (!existing) return { document_type: "terms_and_conditions", version: "", effective_date: "", translations: emptyTranslations() };
  const byLocale = new Map(existing.translations.map((entry) => [entry.locale, entry]));
  return {
    document_type: existing.document_type as LegalDocumentType,
    version: existing.version,
    effective_date: existing.effective_date ? existing.effective_date.slice(0, 10) : "",
    translations: locales.map((locale) => byLocale.get(locale) ?? { locale, title: "", content: "" }),
  };
}

interface LegalDocumentEditorProps {
  state: LegalEditorState;
  onChange: (state: LegalEditorState) => void;
  lockDocumentType?: boolean;
  onSubmit: () => void;
  submitLabel: string;
  pending: boolean;
  disabled?: boolean;
}

export function LegalDocumentEditor({ state, onChange, lockDocumentType = false, onSubmit, submitLabel, pending, disabled = false }: LegalDocumentEditorProps) {
  const { t } = useI18n();
  const [activeLocale, setActiveLocale] = useState<Locale>(locales[0]);
  const active = state.translations.find((entry) => entry.locale === activeLocale) ?? state.translations[0];

  const updateTranslation = (locale: string, patch: Partial<LegalTranslation>) => {
    onChange({
      ...state,
      translations: state.translations.map((entry) => (entry.locale === locale ? { ...entry, ...patch } : entry)),
    });
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label={t("legalDocuments.documentType")} value={state.document_type} disabled={lockDocumentType || disabled} onChange={(e) => onChange({ ...state, document_type: e.target.value as LegalDocumentType })}>
          <option value="terms_and_conditions">{t("legalDocuments.termsAndConditions")}</option>
          <option value="privacy_policy">{t("legalDocuments.privacyPolicy")}</option>
        </Select>
        <Field label={t("legalDocuments.version")} required disabled={disabled} placeholder="1.1" hint={t("legalDocuments.versionRequired")} value={state.version} onChange={(e) => onChange({ ...state, version: e.target.value })} />
        <DatePicker label={t("legalDocuments.effectiveDate")} disabled={disabled} hint={t("legalDocuments.effectiveDateHint")} value={state.effective_date} onChange={(effective_date) => onChange({ ...state, effective_date })} />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">{t("legalDocuments.translations")}</p>
        <div className="flex gap-1 rounded-lg border border-border bg-subtle p-1">
          {state.translations.map((entry) => (
            <button
              key={entry.locale}
              type="button"
              onClick={() => setActiveLocale(entry.locale as Locale)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                activeLocale === entry.locale ? "bg-surface shadow-card" : "text-muted hover:text-foreground"
              }`}
            >
              {localeLabels[entry.locale as keyof typeof localeLabels] ?? entry.locale}
              {!entry.title && !entry.content && <span className="ml-1 text-danger">•</span>}
            </button>
          ))}
        </div>

        {active && (
          <div className="mt-3 space-y-3">
            <Field
              label={`${t("legalDocuments.translationTitle")} (${localeLabels[active.locale as keyof typeof localeLabels] ?? active.locale})`}
              required
              disabled={disabled}
              value={active.title}
              onChange={(e) => updateTranslation(active.locale, { title: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("legalDocuments.translationContent")}</label>
              <textarea
                required
                disabled={disabled}
                rows={12}
                className="w-full rounded-lg border border-input bg-surface p-3 font-mono text-sm outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/20 disabled:opacity-60"
                value={active.content}
                onChange={(e) => updateTranslation(active.locale, { content: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {!disabled && (
        <div className="flex justify-end">
          <Button type="submit" loading={pending}>{submitLabel}</Button>
        </div>
      )}
    </form>
  );
}
