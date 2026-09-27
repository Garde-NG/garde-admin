"use client";

import { useState } from "react";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import { useCountryActions } from "@/lib/query/countries";
import type { Country, CountryInput } from "@/lib/countries/types";

const EMPTY: CountryInput = {
  name: "",
  iso2_code: "",
  iso3_code: "",
  phone_code: "",
  currency_code: "",
  currency_name: "",
  currency_symbol: "",
  flag_emoji: "",
  is_active: true,
};

export function CountryModal({ open, onClose, country }: { open: boolean; onClose: () => void; country: Country | null }) {
  const { t } = useI18n();
  const toast = useToast();
  const { create, update } = useCountryActions();
  const [form, setForm] = useState<CountryInput>(EMPTY);
  const [wasOpen, setWasOpen] = useState(false);
  const isEdit = Boolean(country);
  const pending = create.isPending || update.isPending;

  if (open && !wasOpen) {
    setWasOpen(true);
    setForm(
      country
        ? {
            name: country.name,
            iso2_code: country.iso2_code,
            iso3_code: country.iso3_code,
            phone_code: country.phone_code,
            currency_code: country.currency_code,
            currency_name: country.currency_name,
            currency_symbol: country.currency_symbol,
            flag_emoji: country.flag_emoji,
            is_active: country.is_active,
          }
        : EMPTY,
    );
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const close = () => {
    if (pending) return;
    onClose();
  };

  const onError = (error: unknown) => toast.error(error instanceof Error ? error.message : t("api.genericFailure"));

  const submit = () => {
    if (isEdit && country) {
      update.mutate(
        { id: country.id, input: form },
        { onSuccess: () => { toast.success(t("platformSetup.updateSuccess")); onClose(); }, onError },
      );
    } else {
      create.mutate(form, { onSuccess: () => { toast.success(t("platformSetup.createSuccess")); onClose(); }, onError });
    }
  };

  return (
    <Modal open={open} onClose={close} title={isEdit ? t("platformSetup.editTitle") : t("platformSetup.createTitle")} size="lg">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("platformSetup.name")} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label={t("platformSetup.flagEmoji")} value={form.flag_emoji} onChange={(e) => setForm({ ...form, flag_emoji: e.target.value })} placeholder="🇳🇬" />
          <Field label={t("platformSetup.iso2")} required maxLength={2} value={form.iso2_code} onChange={(e) => setForm({ ...form, iso2_code: e.target.value.toUpperCase() })} />
          <Field label={t("platformSetup.iso3")} required maxLength={3} value={form.iso3_code} onChange={(e) => setForm({ ...form, iso3_code: e.target.value.toUpperCase() })} />
          <Field label={t("platformSetup.phoneCode")} required placeholder="+234" value={form.phone_code} onChange={(e) => setForm({ ...form, phone_code: e.target.value })} />
          <Field label={t("platformSetup.currencyCode")} required maxLength={3} value={form.currency_code} onChange={(e) => setForm({ ...form, currency_code: e.target.value.toUpperCase() })} />
          <Field label={t("platformSetup.currencyName")} required value={form.currency_name} onChange={(e) => setForm({ ...form, currency_name: e.target.value })} />
          <Field label={t("platformSetup.currencySymbol")} required value={form.currency_symbol} onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="size-4 rounded border-input text-brand focus:ring-brand" />
          {t("platformSetup.isActive")}
        </label>
        <ModalActions>
          <Button type="button" variant="secondary" onClick={close} disabled={pending}>{t("common.cancel")}</Button>
          <Button type="submit" loading={pending}>{t("common.save")}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
