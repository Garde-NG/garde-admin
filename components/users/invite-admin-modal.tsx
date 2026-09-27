"use client";

import { useState } from "react";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import { useUserActions } from "@/lib/query/users";
import { useToast } from "@/components/ui/toast";

const EMPTY = { first_name: "", last_name: "", email: "", phone_number: "" };

export function InviteAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { invite } = useUserActions();
  const [form, setForm] = useState(EMPTY);

  const close = () => {
    if (invite.isPending) return;
    setForm(EMPTY);
    invite.reset();
    onClose();
  };

  const submit = () => {
    invite.mutate(form, {
      onSuccess: () => {
        toast.success(t("users.inviteSuccess"));
        setForm(EMPTY);
        onClose();
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : t("api.genericFailure")),
    });
  };

  return (
    <Modal open={open} onClose={close} title={t("users.inviteTitle")}>
      <p className="text-sm text-muted">{t("users.inviteDescription")}</p>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("users.firstName")} required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <Field label={t("users.lastName")} required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        <Field label={t("users.email")} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label={t("users.phone")} type="tel" required placeholder="+2348012345679" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
        <ModalActions>
          <Button type="button" variant="secondary" onClick={close} disabled={invite.isPending}>{t("common.cancel")}</Button>
          <Button type="submit" loading={invite.isPending}>{t("users.inviteAdmin")}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
