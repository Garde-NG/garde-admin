"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/provider";
import { useUsers } from "@/lib/query/users";
import { Pagination } from "@/components/ui/pagination";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { InviteAdminModal } from "@/components/users/invite-admin-modal";
import type { AdminUser } from "@/lib/users/types";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function UsersPage() {
  const { href, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("q") ?? "");

  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const q = searchParams.get("q") ?? "";
  const userType = (searchParams.get("user_type") as "admin" | "customer" | null) ?? undefined;
  const isSuspendedParam = searchParams.get("is_suspended");
  const isSuspended = isSuspendedParam === "true" ? true : isSuspendedParam === "false" ? false : undefined;
  const includeDeleted = searchParams.get("include_deleted") === "true";

  const query = useUsers({ page, pageSize: 20, q: q || undefined, userType, isSuspended, includeDeleted });
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const totalPages = query.data?.meta.total_pages ?? 1;

  const setParams = (updates: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("users.title")} description={t("users.description")} />

      <section className="rounded-xl border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap"
            onSubmit={(event) => {
              event.preventDefault();
              setParams({ q: searchDraft, page: 1 });
            }}
          >
            <div className="w-full sm:w-64">
              <Field label={t("common.search")} placeholder={t("users.searchPlaceholder")} value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
            </div>
            <div className="w-full sm:w-40">
              <Select label={t("users.userType")} hideLabel value={userType ?? ""} onChange={(e) => setParams({ user_type: e.target.value || null, page: 1 })}>
                <option value="">{t("users.allTypes")}</option>
                <option value="admin">{t("users.admin")}</option>
                <option value="customer">{t("users.customer")}</option>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Select label={t("users.statusFilter")} hideLabel value={isSuspendedParam ?? ""} onChange={(e) => setParams({ is_suspended: e.target.value || null, page: 1 })}>
                <option value="">{t("users.allStatuses")}</option>
                <option value="false">{t("users.activeOnly")}</option>
                <option value="true">{t("users.suspendedOnly")}</option>
              </Select>
            </div>
            <label className="flex h-10 items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={includeDeleted} onChange={(e) => setParams({ include_deleted: e.target.checked ? "true" : null, page: 1 })} className="size-4 rounded border-input text-brand focus:ring-brand" />
              {t("users.includeDeleted")}
            </label>
            <Button type="submit" variant="secondary">{t("common.search")}</Button>
          </form>
          <Button onClick={() => setInviteOpen(true)}>{t("users.inviteAdmin")}</Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {query.isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2 px-4 py-4 sm:px-6">
                <div className="h-4 w-1/3 animate-pulse rounded bg-subtle" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-subtle" />
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted">{query.error.message}</p>
            <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>{t("common.tryAgain")}</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium">{t("users.noResults")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium sm:px-6">{t("users.title")}</th>
                  <th className="px-4 py-3 font-medium">{t("users.userType")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("users.lastLogin")}</th>
                  <th className="px-4 py-3 font-medium sm:px-6">{t("users.createdAt")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((user: AdminUser) => (
                  <tr key={user.id} className="transition hover:bg-subtle/60">
                    <td className="px-4 py-3 sm:px-6">
                      <Link href={href(`/users/${user.id}`)} className="block">
                        <span className="block font-medium text-foreground">{[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}</span>
                        <span className="block text-xs text-muted">{user.email}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">{user.user_type === "admin" ? t("users.admin") : t("users.customer")}</td>
                    <td className="px-4 py-3"><UserStatusBadge user={user} /></td>
                    <td className="px-4 py-3 text-muted">{formatDate(user.last_login_at) ?? t("common.never")}</td>
                    <td className="px-4 py-3 text-muted sm:px-6">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />

      <InviteAdminModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
