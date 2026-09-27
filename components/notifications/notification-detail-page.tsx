"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { useNotification, useNotificationActions } from "@/lib/query/notifications";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

function relatedPath(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (path.startsWith("/account/security")) return "/settings/security";
  if (path.startsWith("/account")) return "/settings/profile";
  return path;
}

export function NotificationDetailPage({ id }: { id: string }) {
  const { href, t } = useI18n();
  const query = useNotification(id);
  const { markRead } = useNotificationActions();
  const notification = query.data;
  const markedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!notification || notification.is_read) return;
    if (markedIdRef.current === notification.id) return;
    markedIdRef.current = notification.id;
    markRead.mutate(notification.id);
  }, [notification, markRead]);

  const actionPath = relatedPath(notification?.web_route ?? null);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("notifications.detailTitle")} description={t("notifications.detailDescription")} />

      {query.isLoading ? (
        <div className="h-56 animate-pulse rounded-xl border border-border bg-subtle/50" />
      ) : query.isError ? (
        <section className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-muted">{query.error.message}</p>
          <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>{t("common.tryAgain")}</Button>
        </section>
      ) : notification ? (
        <article className="space-y-5 rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${notification.is_read ? "bg-subtle text-muted" : "bg-brand-soft text-brand"}`}>
              {notification.is_read ? t("notifications.read") : t("notifications.new")}
            </span>
            <time dateTime={notification.created_at} className="text-sm text-muted">{formatDateTime(notification.created_at)}</time>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{notification.title}</h2>
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-foreground">{notification.body}</p>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
            <Link href={href("/notifications")} className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-subtle">
              {t("notifications.backToNotifications")}
            </Link>
            {actionPath && (
              <Link href={href(actionPath)} className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition hover:brightness-110">
                {t("notifications.openRelated")}
              </Link>
            )}
          </div>
        </article>
      ) : null}
    </div>
  );
}
