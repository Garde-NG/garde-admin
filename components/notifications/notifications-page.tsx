"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConfigPageHeader, EmptyState, ErrorState, Icon, SearchInput, SkeletonRows } from "@/components/dashboard/screen-kit";
import { Button } from "@/components/ui/button";
import { DateRangePicker, lagosToday } from "@/components/ui/date-range-picker";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/provider";
import { useNotificationActions, useNotifications } from "@/lib/query/notifications";
import type { NotificationItem } from "@/lib/notifications/types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function relativeTime(value: string, fallback: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 45) return fallback;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotificationsPage() {
  const { href, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = lagosToday();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const from = searchParams.get("start_date") || today;
  const to = searchParams.get("end_date") || from;
  const read = ["unread", "read"].includes(searchParams.get("read") ?? "") ? searchParams.get("read") ?? "" : "";
  const q = searchParams.get("q") ?? "";
  const [searchDraft, setSearchDraft] = useState(q);
  const query = useNotifications({ page, pageSize: 20, startDate: from, endDate: to });
  const { markAllRead } = useNotificationActions();
  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (query.data?.items ?? [])
      .filter((item) => !read || item.is_read === (read === "read"))
      .filter((item) => !term || [item.title, item.body, item.type].join(" ").toLowerCase().includes(term));
  }, [q, query.data?.items, read]);
  const totalPages = query.data?.meta.total_pages ?? 1;
  const unread = items.filter((item) => !item.is_read).length;

  const setParams = (updates: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  const resetToday = () => setParams({ start_date: today, end_date: today, page: 1 });

  return (
    <div className="space-y-5">
      <ConfigPageHeader
        icon="bell"
        showBackLink={false}
        title={t("notifications.title")}
        description={unread > 0 ? `${unread} ${t("notifications.unread").toLowerCase()}` : t("notifications.filterHelp")}
        actions={
          <Button variant="secondary" onClick={() => markAllRead.mutate()} disabled={unread === 0} loading={markAllRead.isPending}>
            <Icon name="checkAll" className="size-4" />
            {t("notifications.markAllRead")}
          </Button>
        }
      />

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_20rem_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setParams({ q: searchDraft, page: 1 });
          }}
        >
          <SearchInput value={searchDraft} onChange={setSearchDraft} placeholder="Search notifications" label="Search notifications" />
          <Select label="Status" hideLabel value={read} onChange={(event) => setParams({ read: event.target.value || null, page: 1 })}>
            <option value="">All notifications</option>
            <option value="unread">{t("notifications.unread")}</option>
            <option value="read">{t("notifications.read")}</option>
          </Select>
          <DateRangePicker compact allowAll={false} align="start" from={from} to={to} onApply={(range) => setParams({ start_date: range.from, end_date: range.to, page: 1 })} />
          <Button type="submit" variant="secondary">{t("common.search")}</Button>
          <Button variant="secondary" onClick={resetToday}>{t("notifications.resetToday")}</Button>
        </form>
        <p className="text-xs text-muted">New notifications appear here as they arrive.</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {query.isLoading ? (
          <SkeletonRows rows={6} columns={3} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon="bell" title={q || read ? "No notifications match" : t("notifications.noResults")}>
            {q || read ? "Try another search or remove a filter." : t("notifications.filterHelp")}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => <NotificationRow key={item.id} item={item} />)}
          </ul>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setParams({ page: page - 1 })}>{t("notifications.previous")}</Button>
          <p className="text-sm text-muted">{t("notifications.page")} {page} / {totalPages}</p>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setParams({ page: page + 1 })}>{t("notifications.next")}</Button>
        </div>
      )}
    </div>
  );

  function NotificationRow({ item }: { item: NotificationItem }) {
    return (
      <li>
        <Link href={href(`/notifications/${item.id}`)} className={`flex items-start gap-3 px-4 py-4 transition hover:bg-subtle/50 sm:gap-4 sm:px-6 ${item.is_read ? "" : "bg-brand-soft/25"}`}>
          <span className="mt-2 flex size-2 shrink-0">{!item.is_read && <span aria-hidden className="size-2 rounded-full bg-brand" />}</span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <span className={`text-sm ${item.is_read ? "font-medium" : "font-semibold"}`}>{item.title}</span>
              <time dateTime={item.created_at} title={formatDateTime(item.created_at)} className="shrink-0 text-xs text-muted">
                {relativeTime(item.created_at, t("notifications.justNow"))}
              </time>
            </span>
            <span className="mt-1 line-clamp-2 block text-sm text-muted">{item.body}</span>
            <span className="mt-2 inline-flex rounded-full bg-subtle px-2.5 py-0.5 text-xs font-medium text-muted">{item.type}</span>
          </span>
          <Icon name="chevronRight" className="mt-1 hidden size-4 shrink-0 text-muted sm:block" />
        </Link>
      </li>
    );
  }
}
