"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { currentLocale } from "@/lib/auth/client";
import { dictionaryFor } from "@/lib/i18n/config";
import type { NotificationItem, NotificationList } from "@/lib/notifications/types";

export const notificationsKey = ["notifications"] as const;
export interface NotificationListParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

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

function listPath(params: NotificationListParams = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.pageSize ?? 20));
  if (params.startDate) search.set("start_date", params.startDate);
  if (params.endDate) search.set("end_date", params.endDate);
  return `?${search}`;
}

export function notificationsListKey(params: NotificationListParams = {}) {
  return [...notificationsKey, params] as const;
}

export function useNotifications(params: NotificationListParams = {}) {
  return useQuery({
    queryKey: notificationsListKey(params),
    queryFn: () => notificationRequest<NotificationList>(listPath(params)),
    staleTime: 30000,
  });
}

export function useNotificationActions() {
  const client = useQueryClient();
  const patchItem = (item: NotificationItem) => {
    client.setQueryData([...notificationsKey, "detail", item.id], item);
    client.setQueriesData<NotificationList>({ queryKey: notificationsKey }, (current) => current && Array.isArray(current.items) ? {
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
      client.setQueriesData<NotificationList>({ queryKey: notificationsKey }, (current) => current ? {
        ...current,
        items: current.items.map((item) => ({ ...item, is_read: true })),
      } : current);
    },
  });
  return { markRead, markAllRead };
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: [...notificationsKey, "detail", id],
    queryFn: () => notificationRequest<NotificationItem>(`/${id}`),
    staleTime: 30000,
  });
}

export async function getNotificationWebSocketUrl(): Promise<string> {
  const data = await notificationRequest<{ url: string }>("/ws-url");
  return data.url;
}
