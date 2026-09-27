"use client";

import { useQuery } from "@tanstack/react-query";
import { createApiRequest } from "./api-client";
import type { AuditLogEntry, AuditLogList } from "@/lib/audit/types";

const auditRequest = createApiRequest("/api/audit-logs");

export const auditLogsKey = ["audit-logs"] as const;

export interface AuditLogListParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
}

function listPath(params: AuditLogListParams = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.pageSize ?? 20));
  if (params.userId) search.set("user_id", params.userId);
  if (params.eventType) search.set("event_type", params.eventType);
  if (params.startDate) search.set("start_date", params.startDate);
  if (params.endDate) search.set("end_date", params.endDate);
  return `?${search}`;
}

export function auditLogsListKey(params: AuditLogListParams = {}) {
  return [...auditLogsKey, params] as const;
}

export function useAuditLogs(params: AuditLogListParams = {}) {
  return useQuery({
    queryKey: auditLogsListKey(params),
    queryFn: () => auditRequest<AuditLogList>(listPath(params)),
    staleTime: 15000,
  });
}

export function useAuditLog(id: string | undefined) {
  return useQuery({
    queryKey: [...auditLogsKey, "detail", id],
    queryFn: () => auditRequest<AuditLogEntry>(`/${id}`),
    enabled: Boolean(id),
    staleTime: 15000,
  });
}
