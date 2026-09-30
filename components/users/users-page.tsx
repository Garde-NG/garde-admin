"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConfigPageHeader, EmptyState, ErrorState, Icon, SearchInput, SkeletonRows } from "@/components/dashboard/screen-kit";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/provider";
import { useUsers } from "@/lib/query/users";
import { Pagination } from "@/components/ui/pagination";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { KycStatusBadge } from "@/components/users/kyc-status-badge";
import { InviteAdminModal } from "@/components/users/invite-admin-modal";
import type { AdminUser } from "@/lib/users/types";

const ROW_GRID = "md:grid-cols-[minmax(0,1.35fr)_7rem_7.5rem_minmax(0,1fr)_8rem_7.5rem]";

function formatDate(value: string | null, locale: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

function nameOf(user: AdminUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

function initials(user: AdminUser) {
  const letters = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.trim();
  return (letters || user.email.charAt(0)).toUpperCase();
}

export function UsersPage({ userType: fixedUserType }: { userType?: "customer" | "admin" }) {
  const { href, t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("q") ?? "");

  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const q = searchParams.get("q") ?? "";
  const userType = fixedUserType ?? ((searchParams.get("user_type") as "admin" | "customer" | null) ?? undefined);
  const isSuspendedParam = searchParams.get("is_suspended");
  const isSuspended = isSuspendedParam === "true" ? true : isSuspendedParam === "false" ? false : undefined;
  const includeDeleted = searchParams.get("include_deleted") === "true";
  const createdAfter = searchParams.get("created_after") ?? "";
  const createdBefore = searchParams.get("created_before") ?? "";
  const sortBy = (searchParams.get("sort_by") as "created_at" | "last_login_at" | "email" | "first_name" | "last_name" | null) ?? "created_at";
  const sortOrder = (searchParams.get("sort_order") as "asc" | "desc" | null) ?? "desc";

  const query = useUsers({ page, pageSize: 20, q: q || undefined, userType, isSuspended, includeDeleted, createdAfter: createdAfter || undefined, createdBefore: createdBefore || undefined, sortBy, sortOrder });
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
      <ConfigPageHeader
        icon={fixedUserType === "admin" ? "idCard" : "users"}
        showBackLink={false}
        title={fixedUserType === "admin" ? t("nav.staff") : fixedUserType === "customer" ? t("nav.customers") : t("users.title")}
        description={fixedUserType === "admin" ? t("users.staffDescription") : fixedUserType === "customer" ? t("users.customerDescription") : t("users.description")}
        actions={fixedUserType !== "customer" ? <Button onClick={() => setInviteOpen(true)}><Icon name="userPlus" className="size-4" />{t("users.inviteAdmin")}</Button> : undefined}
      />

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
          <form
            className={`grid gap-3 ${fixedUserType ? "lg:grid-cols-[minmax(0,1fr)_11rem_13rem_auto]" : "lg:grid-cols-[minmax(0,1fr)_10rem_11rem_13rem_auto]"}`}
            onSubmit={(event) => {
              event.preventDefault();
              setParams({ q: searchDraft, page: 1 });
            }}
          >
            <SearchInput label={t("common.search")} placeholder={t("users.searchPlaceholder")} value={searchDraft} onChange={setSearchDraft} />
            {!fixedUserType && (
              <Select label={t("users.userType")} hideLabel value={userType ?? ""} onChange={(e) => setParams({ user_type: e.target.value || null, page: 1 })}>
                <option value="">{t("users.allTypes")}</option>
                <option value="admin">{t("users.admin")}</option>
                <option value="customer">{t("users.customer")}</option>
              </Select>
            )}
              <Select label={t("users.statusFilter")} hideLabel value={isSuspendedParam ?? ""} onChange={(e) => setParams({ is_suspended: e.target.value || null, page: 1 })}>
                <option value="">{t("users.allStatuses")}</option>
                <option value="false">{t("users.activeOnly")}</option>
                <option value="true">{t("users.suspendedOnly")}</option>
              </Select>
            <button
              type="button"
              aria-pressed={includeDeleted}
              onClick={() => setParams({ include_deleted: includeDeleted ? null : "true", page: 1 })}
              className={`flex h-10 items-center justify-between gap-3 rounded-lg border px-3 text-sm font-medium transition pointer-coarse:h-11 ${
                includeDeleted ? "border-brand bg-brand-soft text-brand" : "border-border bg-surface text-muted hover:bg-subtle hover:text-foreground"
              }`}
            >
              <span className="truncate">{t("users.includeDeleted")}</span>
              <span aria-hidden className={`relative h-5 w-9 shrink-0 rounded-full transition ${includeDeleted ? "bg-brand" : "bg-border"}`}>
                <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition ${includeDeleted ? "left-4" : "left-0.5"}`} />
              </span>
            </button>
            <Button type="submit" variant="secondary">{t("common.search")}</Button>
          </form>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_12rem_auto]">
            <DateRangePicker
              compact
              from={createdAfter}
              to={createdBefore}
              onApply={(range) => setParams({ created_after: range.from || null, created_before: range.to || null, page: 1 })}
            />
            <Select label={t("users.sortBy")} hideLabel value={sortBy} onChange={(e) => setParams({ sort_by: e.target.value === "created_at" ? null : e.target.value, page: 1 })}>
              <option value="created_at">{t("users.sortCreatedAt")}</option>
              <option value="last_login_at">{t("users.sortLastLogin")}</option>
              <option value="email">{t("users.sortEmail")}</option>
              <option value="first_name">{t("users.sortFirstName")}</option>
              <option value="last_name">{t("users.sortLastName")}</option>
            </Select>
            <Select label={t("users.sortOrder")} hideLabel value={sortOrder} onChange={(e) => setParams({ sort_order: e.target.value === "desc" ? null : e.target.value, page: 1 })}>
              <option value="desc">{t("users.sortDescending")}</option>
              <option value="asc">{t("users.sortAscending")}</option>
            </Select>
            {(createdAfter || createdBefore || sortBy !== "created_at" || sortOrder !== "desc") && (
              <Button variant="secondary" onClick={() => setParams({ created_after: null, created_before: null, sort_by: null, sort_order: null, page: 1 })}>
                {t("users.resetFilters")}
              </Button>
            )}
          </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {query.isLoading ? (
          <SkeletonRows rows={6} columns={5} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={fixedUserType === "admin" ? "idCard" : "users"} title={t("users.noResults")}>
            {t("common.tryAnotherSearch")}
          </EmptyState>
        ) : (
          <>
            <div className={`hidden gap-4 bg-subtle/70 px-6 py-3 text-xs font-semibold uppercase text-muted md:grid ${ROW_GRID}`}>
              <span>{t("users.columnPerson")}</span>
              <span>{t("users.userType")}</span>
              <span>{t("users.kycStatus")}</span>
              <span>{t("users.columnContact")}</span>
              <span>{t("users.createdAt")}</span>
              <span>{t("common.status")}</span>
            </div>
            <ul className="divide-y divide-border">
                {items.map((user: AdminUser) => (
                  <li key={user.id}>
                    <Link href={href(`/users/${user.id}`)} className={`grid items-center gap-x-4 gap-y-2.5 px-4 py-4 transition hover:bg-subtle/50 focus-visible:bg-subtle/50 focus-visible:outline-none sm:px-6 ${ROW_GRID}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{initials(user)}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{nameOf(user)}</p>
                          <p className="truncate text-xs text-muted">{formatDate(user.last_login_at, locale) ? `${t("users.lastLogin")}: ${formatDate(user.last_login_at, locale)}` : t("common.never")}</p>
                        </div>
                      </div>
                      <div><span className="capitalize text-sm text-muted md:text-foreground">{user.user_type === "admin" ? t("users.admin") : t("users.customer")}</span></div>
                      <div><KycStatusBadge status={user.kyc_status} /></div>
                      <div className="min-w-0 text-sm">
                        <p className="truncate">{user.email}</p>
                        <p className="truncate text-xs text-muted">{user.phone_number}</p>
                      </div>
                      <div><time dateTime={user.created_at} className="text-sm text-muted md:text-foreground">{formatDate(user.created_at, locale)}</time></div>
                      <div><UserStatusBadge user={user} /></div>
                    </Link>
                  </li>
                ))}
            </ul>
          </>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />

      <InviteAdminModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
