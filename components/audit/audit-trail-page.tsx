"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConfigPageHeader, EmptyState, ErrorState, Icon, SkeletonRows } from "@/components/dashboard/screen-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { DateRangePicker, lagosToday } from "@/components/ui/date-range-picker";
import { useI18n } from "@/lib/i18n/provider";
import { useAuditLogs } from "@/lib/query/audit-logs";
import { useAdminUser, useUsers } from "@/lib/query/users";
import { AUDIT_EVENT_TYPES } from "@/lib/audit/event-types";
import type { AuditLogEntry } from "@/lib/audit/types";
import type { AdminUser } from "@/lib/users/types";

const ROW_GRID = "md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.2fr)_7rem_minmax(0,1fr)]";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
}

function userName(user: AdminUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

function UserSearchSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = useAdminUser(value || undefined);
  const users = useUsers({ page: 1, pageSize: 20, q: search || undefined, includeDeleted: true });
  const items = users.data?.items ?? [];
  const selectedUser = selected.data;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative min-w-0">
      <label className="sr-only">{t("auditTrail.filterUser")}</label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`group flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-lg border bg-surface px-3 text-left text-sm outline-none transition hover:border-brand/50 focus:border-brand focus:ring-3 focus:ring-brand/20 pointer-coarse:h-11 pointer-coarse:text-base ${open ? "border-brand ring-3 ring-brand/20" : "border-input"}`}
      >
        <span className="min-w-0">
          <span className={`block truncate ${selectedUser ? "font-medium" : "text-muted"}`}>{selectedUser ? userName(selectedUser) : value ? "Loading selected user..." : "All users"}</span>
          {selectedUser && <span className="block truncate text-xs text-muted">{selectedUser.email}</span>}
        </span>
        <svg viewBox="0 0 24 24" className={`size-4 shrink-0 text-muted transition group-hover:text-foreground ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div role="listbox" aria-label={t("auditTrail.filterUser")} className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface p-2 shadow-card">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or phone"
              className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/20"
            />
          </div>
          <div className="mt-2 max-h-72 overflow-y-auto overscroll-contain">
            <button type="button" role="option" aria-selected={!value} onClick={() => choose("")} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-subtle">
              <span className="font-medium">All users</span>
              {!value && <Icon name="check" className="size-4 text-brand" />}
            </button>
            {users.isLoading ? (
              <p className="px-3 py-5 text-center text-sm text-muted">Searching...</p>
            ) : users.isError ? (
              <p className="px-3 py-5 text-center text-sm text-danger">{users.error.message}</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-5 text-center text-sm text-muted">No users match your search.</p>
            ) : (
              items.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected={value === user.id}
                  onClick={() => choose(user.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-subtle ${value === user.id ? "text-brand" : ""}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{userName(user)}</span>
                    <span className="block truncate text-xs text-muted">{user.email} · {user.phone_number}</span>
                  </span>
                  {value === user.id && <Icon name="check" className="size-4 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditTrailPage() {
  const { href, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = lagosToday();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const userId = searchParams.get("user_id") ?? "";
  const eventType = searchParams.get("event_type") ?? "";
  const startDate = searchParams.get("start_date") || today;
  const endDate = searchParams.get("end_date") || today;
  const isDefaultToday = !searchParams.get("start_date") && !searchParams.get("end_date");

  const query = useAuditLogs({ page, pageSize: 20, userId: userId || undefined, eventType: eventType || undefined, startDate, endDate });
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
      <ConfigPageHeader icon="shield" showBackLink={false} title={t("auditTrail.title")} description={t("auditTrail.description")} />

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <form
          className="grid gap-3 lg:grid-cols-[20rem_minmax(0,1fr)_14rem_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setParams({ page: 1 });
          }}
        >
          <DateRangePicker compact allowAll={false} from={startDate} to={endDate} onApply={(range) => setParams({ start_date: range.from, end_date: range.to, page: 1 })} />
          <UserSearchSelect value={userId} onChange={(id) => setParams({ user_id: id || null, page: 1 })} />
          <Select label={t("auditTrail.filterEventType")} hideLabel value={eventType} onChange={(e) => setParams({ event_type: e.target.value || null, page: 1 })}>
              <option value="">{t("auditTrail.allEventTypes")}</option>
              {AUDIT_EVENT_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>{t(entry.labelKey)}</option>
              ))}
            </Select>
          <Button type="submit" variant="secondary">{t("common.search")}</Button>
        </form>
        {isDefaultToday && <p className="text-xs text-muted">{t("auditTrail.todayNotice")}</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {query.isLoading ? (
          <SkeletonRows rows={6} columns={5} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon="shield" title={t("auditTrail.noResults")}>
            Try a wider date range or remove a filter.
          </EmptyState>
        ) : (
          <>
            <div className={`hidden gap-4 bg-subtle/70 px-6 py-3 text-xs font-semibold uppercase text-muted md:grid ${ROW_GRID}`}>
              <span>{t("auditTrail.columnTime")}</span>
              <span>{t("auditTrail.columnAccount")}</span>
              <span>{t("auditTrail.columnEvent")}</span>
              <span>{t("auditTrail.columnIp")}</span>
              <span>{t("auditTrail.columnDevice")}</span>
            </div>
            <ul className="divide-y divide-border">
                {items.map((entry: AuditLogEntry) => (
                  <li key={entry.id} className={entry.success ? "" : "bg-danger-soft/40"}>
                    <Link href={href(`/audit-trail/${entry.id}`)} className={`grid items-center gap-x-4 gap-y-2 px-4 py-4 transition hover:bg-subtle/50 focus-visible:bg-subtle/50 focus-visible:outline-none sm:px-6 ${ROW_GRID}`}>
                      <p className="text-sm text-muted">{formatDateTime(entry.created_at)}</p>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{entry.email || t("auditTrail.unknownAccount")}</p>
                        {entry.user_id && <p className="truncate font-mono text-xs text-muted">{entry.user_id}</p>}
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm">{entry.description}</span>
                        {!entry.success && <Badge tone="danger">{t("auditTrail.outcomeFailed")}</Badge>}
                      </div>
                      <p className="font-mono text-xs text-muted">{entry.ip_address ?? "—"}</p>
                      <p className="truncate text-xs text-muted" title={entry.user_agent ?? undefined}>{entry.user_agent ?? "—"}</p>
                      <Icon name="chevronRight" className="hidden size-4 text-muted md:block" />
                    </Link>
                  </li>
                ))}
            </ul>
          </>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />
    </div>
  );
}
