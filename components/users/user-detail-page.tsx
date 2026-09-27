"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfigPageHeader, ErrorState, Icon } from "@/components/dashboard/screen-kit";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import { useAdminUser, useUserActions } from "@/lib/query/users";
import { useUser } from "@/lib/query/user";
import { UserStatusBadge } from "@/components/users/user-status-badge";

function formatDateTime(value: string | null, locale: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function shortId(value: string) {
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function CopyValue({ value, display = value, mono = false }: { value: string; display?: string; mono?: boolean }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex min-w-0 items-center justify-end gap-1.5">
      <span title={value} className={`min-w-0 truncate ${mono ? "font-mono text-xs" : ""}`}>{display}</span>
      <button
        type="button"
        title={t("common.copy")}
        aria-label={t("common.copy")}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          } catch {}
        }}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-subtle hover:text-foreground"
      >
        <Icon name={copied ? "check" : "copy"} className="size-3.5" />
      </button>
    </span>
  );
}

function fullName(user: { first_name: string; last_name: string; email: string }) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

function initials(user: { first_name: string; last_name: string; email: string }) {
  const letters = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.trim();
  return (letters || user.email.charAt(0)).toUpperCase();
}

export function UserDetailPage({ id }: { id: string }) {
  const { href, t, locale } = useI18n();
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
    <div className="space-y-5">
      <ConfigPageHeader
        icon={target?.user_type === "admin" ? "idCard" : "users"}
        title={t("users.detailTitle")}
        backHref={target?.user_type === "admin" ? "/staff" : target?.user_type === "customer" ? "/customers" : "/users"}
        backLabel={target?.user_type === "admin" ? t("nav.staff") : target?.user_type === "customer" ? t("nav.customers") : t("users.title")}
        description={target ? fullName(target) : undefined}
      />

      {query.isLoading ? (
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-subtle/40" />
      ) : query.isError ? (
        <section className="rounded-2xl border border-border bg-surface shadow-card">
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        </section>
      ) : target ? (
        <>
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-soft text-2xl font-semibold text-brand">{initials(target)}</span>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{fullName(target)}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <UserStatusBadge user={target} />
                  <span className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-medium capitalize text-muted">{target.user_type === "admin" ? t("users.admin") : t("users.customer")}</span>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <span className="inline-flex min-w-0 items-center gap-1"><Icon name="mail" className="size-3.5 shrink-0" /><CopyValue value={target.email} /></span>
                  <span className="inline-flex items-center gap-1"><Icon name="phone" className="size-3.5" /><CopyValue value={target.phone_number} /></span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={href(`/audit-trail?user_id=${target.id}`)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-subtle">
                <Icon name="shield" className="size-4" />
                {t("users.viewAuditTrail")}
              </Link>
            </div>
          </header>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 space-y-5">
              <section className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <h2 className="text-sm font-semibold">{t("users.sectionLifecycle")}</h2>
                  <UserStatusBadge user={target} />
                </div>
                <div className="divide-y divide-border">
                  <Row label={t("users.lastLogin")} value={formatDateTime(target.last_login_at, locale) ?? t("common.never")} />
                  <Row label={t("users.createdAt")} value={formatDateTime(target.created_at, locale)} />
                  <Row label={t("users.lastUpdated")} value={formatDateTime(target.updated_at, locale)} />
                  {target.is_suspended && <Row label={t("users.suspendedReasonLabel")} value={target.suspended_reason ?? "—"} />}
                  {target.is_suspended && <Row label={t("users.suspendedSince")} value={formatDateTime(target.suspended_at, locale)} />}
                  {target.is_deleted && <Row label={t("users.deletedSince")} value={formatDateTime(target.deleted_at, locale)} />}
                  {target.is_invite_pending && <Row label={t("users.inviteSuccess")} value={formatDateTime(target.invited_at, locale)} />}
                  {target.invite_accepted_at && <Row label={t("users.inviteAccepted")} value={formatDateTime(target.invite_accepted_at, locale)} />}
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
                <h3 className="text-sm font-semibold">{t("common.actions")}</h3>
                {isSelf && <p className="text-xs text-muted">{t("users.cannotActOnSelf")}</p>}
                <div className="flex flex-wrap gap-2">
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
            </div>

            <aside className="space-y-5 lg:sticky lg:top-20">
              <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
                <header className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
                  <Icon name="user" className="size-4 text-muted" />
                  <h2 className="text-sm font-semibold">{t("users.sectionAccount")}</h2>
                </header>
                <dl className="divide-y divide-border px-4 sm:px-5">
                  <Row label={t("users.accountId")} value={<CopyValue value={target.id} display={shortId(target.id)} mono />} />
                  <Row label={t("users.phone")} value={<CopyValue value={target.phone_number} />} />
                  <Row label={t("users.email")} value={<CopyValue value={target.email} />} />
                  <Row label={t("users.userType")} value={target.user_type === "admin" ? t("users.admin") : t("users.customer")} />
                </dl>
              </section>

              <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
                <header className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
                  <Icon name="lock" className="size-4 text-muted" />
                  <h2 className="text-sm font-semibold">{t("common.security")}</h2>
                </header>
                <dl className="divide-y divide-border px-4 sm:px-5">
                  <Row label={t("users.twoFactor")} value={target.is_two_factor_enabled ? t("users.twoFactorEnabled") : t("users.twoFactorDisabled")} />
                  <Row label={t("users.twoFactorMethod")} value={target.two_factor_method ?? "—"} />
                  <Row label={t("security.passkeys")} value={target.is_passwordless_enabled ? t("users.passkeysEnabled") : t("common.no")} />
                </dl>
                <p className="border-t border-border px-4 py-3 text-xs text-muted sm:px-5">{t("users.securityFieldsHint")}</p>
              </section>
            </aside>
          </div>
        </>
      ) : null}

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
