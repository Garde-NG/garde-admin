"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import { useAdminUser, useUserActions } from "@/lib/query/users";
import { useUser } from "@/lib/query/user";
import { UserStatusBadge } from "@/components/users/user-status-badge";

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function UserDetailPage({ id }: { id: string }) {
  const { href, t } = useI18n();
  const toast = useToast();
  const query = useAdminUser(id);
  const { user: viewer } = useUser();
  const { suspend, unsuspend, remove, restore, resendInvite } = useUserActions();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const target = query.data;
  const isSelf = Boolean(target && viewer.id === target.id);

  const onError = (error: unknown) => toast.error(error instanceof Error ? error.message : t("api.genericFailure"));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("users.detailTitle")} description={target ? [target.first_name, target.last_name].filter(Boolean).join(" ") || target.email : undefined} />

      {query.isLoading ? (
        <div className="h-72 animate-pulse rounded-xl border border-border bg-subtle/50" />
      ) : query.isError ? (
        <section className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-muted">{query.error.message}</p>
          <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>{t("common.tryAgain")}</Button>
        </section>
      ) : target ? (
        <>
          <section className="space-y-1 rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-semibold">{[target.first_name, target.last_name].filter(Boolean).join(" ") || target.email}</h2>
                <p className="text-sm text-muted">{target.email}</p>
              </div>
              <UserStatusBadge user={target} />
            </div>
            <div className="divide-y divide-border">
              <Row label={t("users.accountId")} value={<span className="font-mono text-xs">{target.id}</span>} />
              <Row label={t("users.phone")} value={target.phone_number} />
              <Row label={t("users.userType")} value={target.user_type === "admin" ? t("users.admin") : t("users.customer")} />
              <Row label={t("users.twoFactor")} value={target.is_two_factor_enabled ? t("users.twoFactorEnabled") : t("users.twoFactorDisabled")} />
              <Row label={t("security.passkeys")} value={target.is_passwordless_enabled ? t("users.passkeysEnabled") : t("common.no")} />
              <Row label={t("users.lastLogin")} value={formatDateTime(target.last_login_at) ?? t("common.never")} />
              <Row label={t("users.createdAt")} value={formatDateTime(target.created_at)} />
              {target.is_suspended && <Row label={t("users.suspendedReasonLabel")} value={target.suspended_reason ?? "—"} />}
              {target.is_suspended && <Row label={t("users.suspendedSince")} value={formatDateTime(target.suspended_at)} />}
              {target.is_deleted && <Row label={t("users.deletedSince")} value={formatDateTime(target.deleted_at)} />}
              {target.is_invite_pending && <Row label={t("users.inviteSuccess")} value={formatDateTime(target.invited_at)} />}
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <h3 className="text-sm font-semibold">{t("common.actions")}</h3>
            {isSelf && <p className="text-xs text-muted">{t("users.cannotActOnSelf")}</p>}
            <div className="flex flex-wrap gap-2">
              <Link href={href(`/audit-trail?user_id=${target.id}`)} className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-subtle">
                {t("users.viewAuditTrail")}
              </Link>
              {target.is_invite_pending && (
                <Button
                  variant="secondary"
                  loading={resendInvite.isPending}
                  onClick={() => resendInvite.mutate(target.id, { onSuccess: () => toast.success(t("users.resendInviteSuccess")), onError })}
                >
                  {t("users.resendInvite")}
                </Button>
              )}
              {!target.is_deleted && (target.is_suspended ? (
                <Button
                  variant="secondary"
                  disabled={isSelf}
                  loading={unsuspend.isPending}
                  onClick={() => unsuspend.mutate(target.id, { onSuccess: () => toast.success(t("users.unsuspendSuccess")), onError })}
                >
                  {t("users.unsuspend")}
                </Button>
              ) : (
                <Button variant="secondary" disabled={isSelf} onClick={() => setSuspendOpen(true)}>{t("users.suspend")}</Button>
              ))}
              {target.is_deleted ? (
                <Button
                  variant="secondary"
                  loading={restore.isPending}
                  onClick={() => restore.mutate(target.id, { onSuccess: () => toast.success(t("users.restoreSuccess")), onError })}
                >
                  {t("users.restore")}
                </Button>
              ) : (
                <Button variant="danger" disabled={isSelf} onClick={() => setDeleteOpen(true)}>{t("users.deleteUser")}</Button>
              )}
            </div>
          </section>
        </>
      ) : null}

      <Link href={href("/users")} className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-subtle">
        {t("users.backToList")}
      </Link>

      <Modal open={suspendOpen} onClose={() => { setSuspendOpen(false); setReason(""); }} title={t("users.suspendConfirmTitle")}>
        <p className="text-sm text-muted">{t("users.suspendConfirmBody")}</p>
        <Field label={t("users.suspendReasonLabel")} hint={t("common.optional")} placeholder={t("users.suspendReasonPlaceholder")} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        <ModalActions>
          <Button variant="secondary" onClick={() => { setSuspendOpen(false); setReason(""); }} disabled={suspend.isPending}>{t("common.cancel")}</Button>
          <Button
            variant="danger"
            loading={suspend.isPending}
            onClick={() =>
              suspend.mutate(
                { id, reason: reason || undefined },
                {
                  onSuccess: () => { toast.success(t("users.suspendSuccess")); setSuspendOpen(false); setReason(""); },
                  onError,
                },
              )
            }
          >
            {t("users.suspend")}
          </Button>
        </ModalActions>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("users.deleteConfirmTitle")}>
        <p className="text-sm text-muted">{t("users.deleteConfirmBody")}</p>
        <ModalActions>
          <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={remove.isPending}>{t("common.cancel")}</Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(id, {
                onSuccess: () => { toast.success(t("users.deleteSuccess")); setDeleteOpen(false); query.refetch(); },
                onError,
              })
            }
          >
            {t("users.deleteUser")}
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
