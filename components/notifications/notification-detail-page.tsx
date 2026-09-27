"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ConfigPageHeader, ErrorState, Icon } from "@/components/dashboard/screen-kit";
import { Badge } from "@/components/ui/badge";
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
      <ConfigPageHeader
        icon="bell"
        title={t("notifications.detailTitle")}
        backHref="/notifications"
        backLabel={t("notifications.title")}
        description={t("notifications.detailDescription")}
      />

      {query.isLoading ? (
        <div className="h-56 animate-pulse rounded-2xl border border-border bg-subtle/40" />
      ) : query.isError ? (
        <section className="rounded-2xl border border-border bg-surface shadow-card">
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        </section>
      ) : notification ? (
        <article className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={notification.is_read ? "neutral" : "brand"}>
              <span className="inline-flex items-center gap-1.5">
                {!notification.is_read && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
                {notification.is_read ? t("notifications.read") : t("notifications.new")}
              </span>
            </Badge>
            <Badge tone="neutral">{notification.type}</Badge>
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight">{notification.title}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Icon name="clock" className="size-4" />
              <time dateTime={notification.created_at}>{formatDateTime(notification.created_at)}</time>
            </p>
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-foreground">{notification.body}</p>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
            {actionPath && (
              <Link href={href(actionPath)} className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition hover:brightness-110">
                {t("notifications.openRelated")} <Icon name="arrowRight" className="size-4" />
              </Link>
            )}
            <Link href={href("/notifications")} className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-subtle">
              {t("notifications.backToNotifications")}
            </Link>
          </div>
        </article>
      ) : null}
    </div>
  );
}
