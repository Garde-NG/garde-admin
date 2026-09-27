"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { DateRangePicker, lagosToday } from "@/components/ui/date-range-picker";
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
  const query = useNotifications({ page, pageSize: 20, startDate: from, endDate: to });
  const { markAllRead } = useNotificationActions();
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
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
      <PageHeader
        title={t("notifications.title")}
        description={unread > 0 ? `${unread} ${t("notifications.unread").toLowerCase()}` : t("notifications.filterHelp")}
      />

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker
          compact
          allowAll={false}
          align="start"
          from={from}
          to={to}
          onApply={(range) => setParams({ start_date: range.from, end_date: range.to, page: 1 })}
          className="sm:w-80"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={resetToday}>{t("notifications.resetToday")}</Button>
          <Button variant="secondary" onClick={() => markAllRead.mutate()} disabled={unread === 0} loading={markAllRead.isPending}>
            {t("notifications.markAllRead")}
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {query.isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2 px-4 py-4 sm:px-6">
                <div className="h-4 w-2/3 animate-pulse rounded bg-subtle" />
                <div className="h-3 w-full animate-pulse rounded bg-subtle" />
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
            <p className="text-sm font-medium">{t("notifications.noResults")}</p>
            <p className="mt-1 text-sm text-muted">{t("notifications.filterHelp")}</p>
          </div>
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
        <Link href={href(`/notifications/${item.id}`)} className={`flex items-start gap-3 px-4 py-4 transition hover:bg-subtle/60 sm:px-6 ${item.is_read ? "" : "bg-brand-soft/25"}`}>
          <span className={`mt-2 size-2 shrink-0 rounded-full ${item.is_read ? "bg-border" : "bg-brand"}`} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <span className={`text-sm ${item.is_read ? "font-medium" : "font-semibold"}`}>{item.title}</span>
              <time dateTime={item.created_at} title={formatDateTime(item.created_at)} className="shrink-0 text-xs text-muted">
                {relativeTime(item.created_at, t("notifications.justNow"))}
              </time>
            </span>
            <span className="mt-1 line-clamp-2 block text-sm text-muted">{item.body}</span>
          </span>
        </Link>
      </li>
    );
  }
}
