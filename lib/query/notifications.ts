"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { currentLocale } from "@/lib/auth/client";
import { dictionaryFor } from "@/lib/i18n/config";
import type { NotificationItem, NotificationList } from "@/lib/notifications/types";

export const notificationsKey = ["notifications"] as const;

async function notificationRequest<T>(path = "", init?: RequestInit): Promise<T> {
  const locale = currentLocale();
  const response = await fetch(`/api/notifications${path}`, {
    ...init,
    headers: {
      "Accept-Language": locale,
      "X-Garde-Locale": locale,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (response.status === 204) return undefined as T;
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) throw new Error(result?.message || dictionaryFor(locale).api.genericFailure);
  return result.data as T;
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationsKey,
    queryFn: () => notificationRequest<NotificationList>("?page_size=20&start_date=2020-01-01"),
    staleTime: 30000,
  });
}

export function useNotificationActions() {
  const client = useQueryClient();
  const patchItem = (item: NotificationItem) => {
    client.setQueryData<NotificationList>(notificationsKey, (current) => current ? {
      ...current,
      items: current.items.map((entry) => entry.id === item.id ? item : entry),
    } : current);
  };
  const markRead = useMutation({
    mutationFn: (id: string) => notificationRequest<NotificationItem>(`/${id}/read`, { method: "POST" }),
    onSuccess: patchItem,
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationRequest<void>("/read-all", { method: "POST" }),
    onSuccess: () => {
      client.setQueryData<NotificationList>(notificationsKey, (current) => current ? {
        ...current,
        items: current.items.map((item) => ({ ...item, is_read: true })),
      } : current);
    },
  });
  return { markRead, markAllRead };
}

export async function getNotificationWebSocketUrl(): Promise<string> {
  const data = await notificationRequest<{ url: string }>("/ws-url");
  return data.url;
}
