"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getNotificationWebSocketUrl, notificationsKey, notificationsListKey, useNotificationActions, useNotifications } from "@/lib/query/notifications";
import type { NotificationItem, NotificationList } from "@/lib/notifications/types";
import { useI18n } from "@/lib/i18n/provider";
import { useToast } from "@/components/ui/toast";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function relativeTime(value: string, fallback: string) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 45) return fallback;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotificationBell() {
  const { href, t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const client = useQueryClient();
  const query = useNotifications();
  const listKey = useMemo(() => notificationsListKey({}), []);
  const { markRead, markAllRead } = useNotificationActions();
  const [open, setOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState<"connected" | "reconnecting" | "error">("reconnecting");
  const retry = useRef(0);
  const closedByUnmount = useRef(false);
  const triedRefreshAfter4401 = useRef(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setOpen(false);
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

  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const unread = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  useEffect(() => {
    closedByUnmount.current = false;
    let socket: WebSocket | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      try {
        const url = await getNotificationWebSocketUrl();
        socket = new WebSocket(url);
        socket.onopen = () => {
          retry.current = 0;
          triedRefreshAfter4401.current = false;
          setLiveStatus("connected");
          void client.invalidateQueries({ queryKey: notificationsKey });
        };
        socket.onmessage = (event) => {
          const notification = JSON.parse(event.data) as NotificationItem;
          client.setQueryData<NotificationList>(listKey, (current) => {
            if (!current) return { items: [notification], meta: { page: 1, page_size: 20, total_items: 1, total_pages: 1 } };
            if (current.items.some((item) => item.id === notification.id)) return current;
            return { ...current, items: [notification, ...current.items].slice(0, current.meta.page_size), meta: { ...current.meta, total_items: current.meta.total_items + 1 } };
          });
          toast.info(notification.title);
        };
        socket.onclose = (event) => {
          if (closedByUnmount.current) return;
          if (event.code === 4401) {
            // Token was stale at connect time. `getNotificationWebSocketUrl()` mints a fresh
            // token (refreshing it server-side if needed), so try once more before giving up.
            if (!triedRefreshAfter4401.current) {
              triedRefreshAfter4401.current = true;
              setLiveStatus("reconnecting");
              void connect();
              return;
            }
            setLiveStatus("error");
            void client.invalidateQueries({ queryKey: notificationsKey });
            return;
          }
          setLiveStatus("reconnecting");
          const delay = Math.min(30000, 1000 * 2 ** retry.current++);
          timeout = setTimeout(connect, delay);
        };
        socket.onerror = () => setLiveStatus("error");
      } catch {
        setLiveStatus("error");
        const delay = Math.min(30000, 1000 * 2 ** retry.current++);
        timeout = setTimeout(connect, delay);
      }
    };

    void connect();
    return () => {
      closedByUnmount.current = true;
      if (timeout) clearTimeout(timeout);
      socket?.close();
    };
  }, [client, listKey, toast]);

  const openNotification = (item: NotificationItem) => {
    if (!item.is_read) markRead.mutate(item.id);
    setOpen(false);
    router.push(href(`/notifications/${item.id}`));
  };

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        aria-label={t("notifications.open")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-10 items-center justify-center rounded-lg text-muted transition hover:bg-subtle hover:text-foreground"
      >
        <BellIcon />
        {unread > 0 && (
          <span aria-label={t("notifications.unread")} className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-full z-40 mt-2 flex max-h-[calc(100dvh-5.5rem-env(safe-area-inset-top))] animate-pop-in flex-col overflow-hidden rounded-xl sm:absolute sm:inset-x-auto sm:right-0 sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:max-h-[min(34rem,calc(100dvh-5rem))] border border-border bg-surface shadow-card">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">{t("notifications.title")}</h2>
              {liveStatus !== "connected" && <p className="mt-0.5 text-xs text-muted">{liveStatus === "reconnecting" ? t("notifications.reconnecting") : t("notifications.liveError")}</p>}
            </div>
            {unread > 0 && (
              <button type="button" onClick={() => markAllRead.mutate()} className="rounded-md px-2 py-1 text-xs font-medium text-brand transition hover:bg-brand-soft">
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {query.isError ? (
              <p className="px-4 py-6 text-center text-sm text-muted">{t("notifications.loadError")}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">{t("notifications.empty")}</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openNotification(item)}
                  className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-subtle"
                >
                  <span className={`mt-1 size-2 shrink-0 rounded-full ${item.is_read ? "bg-border" : "bg-brand"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="line-clamp-1 text-sm font-medium">{item.title}</span>
                      <span className="shrink-0 text-xs text-muted">{relativeTime(item.created_at, t("notifications.justNow"))}</span>
                    </span>
                    <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{item.body}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="shrink-0 border-t border-border p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(href("/notifications"));
              }}
              className="flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium text-brand transition hover:bg-brand-soft"
            >
              {t("notifications.viewAll")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
