"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/dashboard/screen-kit";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Modal, ModalActions } from "@/components/ui/modal";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import { useMerchantActions } from "@/lib/query/cards";
import { MCC_PATTERN, SLUG_PATTERN, isValidPattern, slugify } from "@/lib/cards/format";
import type { Merchant } from "@/lib/cards/types";

export interface MerchantDraft {
  name: string;
  slug: string;
  category: string;
  patterns: string[];
  mccCodes: string[];
  /** An MCC seen on real traffic, offered as a one-click addition. */
  suggestedMcc?: string | null;
  /** The statement name this draft came from, shown for context. */
  source?: string;
}

const COMMON_CATEGORIES = ["streaming", "betting", "shopping", "travel", "food", "software", "gaming", "telecom", "utilities"];

export function MerchantModal({
  open,
  onClose,
  merchant,
  draft,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  /** Editing an existing catalog entry. */
  merchant?: Merchant | null;
  /** Creating, optionally prefilled (e.g. from an observed merchant). */
  draft?: MerchantDraft | null;
  categories: string[];
}) {
  const { t } = useI18n();
  const toast = useToast();
  const listId = useId();
  const { create, update } = useMerchantActions();
  const editing = Boolean(merchant);
  const [form, setForm] = useState<MerchantDraft>({ name: "", slug: "", category: "", patterns: [], mccCodes: [] });
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  const pending = create.isPending || update.isPending;

  if (open && !wasOpen) {
    setWasOpen(true);
    setSubmitted(false);
    setSlugTouched(Boolean(merchant || draft?.slug));
    setForm(
      merchant
        ? { name: merchant.name, slug: merchant.slug, category: merchant.category, patterns: [], mccCodes: merchant.mcc_codes }
        : draft ?? { name: "", slug: "", category: "", patterns: [], mccCodes: [] },
    );
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const errors = {
    name: form.name.trim().length < 2 ? t("merchants.errorName") : null,
    slug: !editing && !SLUG_PATTERN.test(form.slug) ? t("merchants.errorSlug") : null,
    category: form.category.trim().length < 2 ? t("merchants.errorCategory") : null,
    patterns: !editing && form.patterns.length === 0 ? t("merchants.errorPatternsRequired") : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (key: keyof typeof errors) => (submitted ? errors[key] ?? undefined : undefined);
  const categoryOptions = Array.from(new Set([...categories, ...COMMON_CATEGORIES])).sort();
  const close = () => !pending && onClose();

  const submit = () => {
    setSubmitted(true);
    if (!valid) return;
    const onError = (error: Error) => toast.error(error.message);
    if (editing && merchant) {
      update.mutate(
        {
          slug: merchant.slug,
          input: {
            name: form.name.trim(),
            category: form.category.trim().toLowerCase(),
            mcc_codes: form.mccCodes,
            ...(form.patterns.length > 0 ? { descriptor_patterns: form.patterns } : {}),
          },
        },
        { onSuccess: () => { toast.success(t("merchants.updateSuccess")); onClose(); }, onError },
      );
    } else {
      create.mutate(
        { slug: form.slug, name: form.name.trim(), category: form.category.trim().toLowerCase(), descriptor_patterns: form.patterns, mcc_codes: form.mccCodes },
        { onSuccess: () => { toast.success(t("merchants.createSuccess").replace("{name}", form.name.trim())); onClose(); }, onError },
      );
    }
  };

  return (
    <Modal open={open} onClose={close} title={editing ? t("merchants.editTitle") : t("merchants.createTitle")} size="lg">
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {form.source && (
          <div className="flex items-center gap-2 rounded-lg bg-subtle px-3 py-2 text-sm">
            <Icon name="activity" className="size-4 shrink-0 text-muted" />
            <span className="text-muted">{t("merchants.fromObserved")}</span>
            <code className="min-w-0 truncate font-mono font-medium">{form.source}</code>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("merchants.name")}
            required
            maxLength={80}
            placeholder="Netflix"
            value={form.name}
            error={show("name")}
            onChange={(event) => {
              const name = event.target.value;
              setForm((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) }));
            }}
          />
          <Field
            label={t("merchants.slug")}
            required
            readOnly={editing}
            maxLength={40}
            placeholder="netflix"
            className="font-mono"
            value={form.slug}
            error={show("slug")}
            hint={editing ? t("merchants.slugLocked") : t("merchants.slugHint")}
            onChange={(event) => {
              setSlugTouched(true);
              setForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40) }));
            }}
          />
        </div>

        <div className="space-y-2">
          <Field
            label={t("merchants.category")}
            required
            maxLength={30}
            list={listId}
            placeholder="streaming"
            value={form.category}
            error={show("category")}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          />
          <datalist id={listId}>{categoryOptions.map((value) => <option key={value} value={value} />)}</datalist>
          <div className="flex flex-wrap gap-1.5">
            {categoryOptions.slice(0, 10).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={form.category === value}
                onClick={() => setForm((current) => ({ ...current, category: value }))}
                className={`h-7 rounded-full border px-2.5 text-xs font-medium capitalize transition ${form.category === value ? "border-brand bg-brand-soft text-brand" : "border-border text-muted hover:bg-subtle hover:text-foreground"}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <TagInput
          label={editing ? t("merchants.patternsReplace") : t("merchants.patterns")}
          values={form.patterns}
          onChange={(patterns) => setForm((current) => ({ ...current, patterns }))}
          normalize={(value) => value.trim().toUpperCase()}
          validate={(value) => (isValidPattern(value) ? null : t("merchants.errorPatternShort"))}
          placeholder="NETFLIX"
          error={show("patterns")}
          hint={editing ? t("merchants.patternsReplaceHint") : t("merchants.patternsHint")}
          mono
        />

        <div className="space-y-2">
          <TagInput
            label={`${t("merchants.mccCodes")} (${t("common.optional").toLowerCase()})`}
            values={form.mccCodes}
            onChange={(mccCodes) => setForm((current) => ({ ...current, mccCodes }))}
            normalize={(value) => value.trim()}
            validate={(value) => (MCC_PATTERN.test(value) ? null : t("merchants.errorMcc"))}
            placeholder="4899"
            hint={t("merchants.mccHint")}
            mono
          />
          {form.suggestedMcc && !form.mccCodes.includes(form.suggestedMcc) && MCC_PATTERN.test(form.suggestedMcc) && (
            <button type="button" onClick={() => setForm((current) => ({ ...current, mccCodes: [...current.mccCodes, current.suggestedMcc!] }))} className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-brand/50 px-2.5 text-xs font-medium text-brand transition hover:bg-brand-soft">
              <Icon name="plus" className="size-3.5" />{t("merchants.addSeenMcc").replace("{mcc}", form.suggestedMcc)}
            </button>
          )}
        </div>

        {editing && <Alert tone="info">{t("merchants.editNotice")}</Alert>}

        <ModalActions>
          <Button variant="secondary" onClick={close} disabled={pending}>{t("common.cancel")}</Button>
          <Button type="submit" loading={pending}>{editing ? t("common.save") : t("merchants.addToCatalog")}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
