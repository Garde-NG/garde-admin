"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { DateRangePicker, lagosToday } from "@/components/ui/date-range-picker";
import { useI18n } from "@/lib/i18n/provider";
import { useAuditLogs } from "@/lib/query/audit-logs";
import { AUDIT_EVENT_TYPES } from "@/lib/audit/event-types";
import type { AuditLogEntry } from "@/lib/audit/types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
}

export function AuditTrailPage() {
  const { href, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = lagosToday();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const userId = searchParams.get("user_id") ?? "";
  const [userIdDraft, setUserIdDraft] = useState(userId);
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
      <PageHeader title={t("auditTrail.title")} description={t("auditTrail.description")} />

      <section className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-card">
        <form
          className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setParams({ user_id: userIdDraft, page: 1 });
          }}
        >
          <div className="w-full sm:w-72">
            <DateRangePicker compact allowAll={false} from={startDate} to={endDate} onApply={(range) => setParams({ start_date: range.from, end_date: range.to, page: 1 })} />
          </div>
          <div className="w-full sm:w-56">
            <Field label={t("auditTrail.filterUser")} placeholder={t("auditTrail.filterUserPlaceholder")} value={userIdDraft} onChange={(e) => setUserIdDraft(e.target.value)} />
          </div>
          <div className="w-full sm:w-56">
            <Select label={t("auditTrail.filterEventType")} value={eventType} onChange={(e) => setParams({ event_type: e.target.value || null, page: 1 })}>
              <option value="">{t("auditTrail.allEventTypes")}</option>
              {AUDIT_EVENT_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>{t(entry.labelKey)}</option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">{t("common.search")}</Button>
        </form>
        {isDefaultToday && <p className="text-xs text-muted">{t("auditTrail.todayNotice")}</p>}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {query.isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2 px-4 py-4 sm:px-6">
                <div className="h-4 w-1/2 animate-pulse rounded bg-subtle" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-subtle" />
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
            <p className="text-sm font-medium">{t("auditTrail.noResults")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium sm:px-6">{t("auditTrail.columnTime")}</th>
                  <th className="px-4 py-3 font-medium">{t("auditTrail.columnAccount")}</th>
                  <th className="px-4 py-3 font-medium">{t("auditTrail.columnEvent")}</th>
                  <th className="px-4 py-3 font-medium">{t("auditTrail.columnIp")}</th>
                  <th className="px-4 py-3 font-medium sm:px-6">{t("auditTrail.columnDevice")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((entry: AuditLogEntry) => (
                  <tr key={entry.id} className={`transition hover:bg-subtle/60 ${entry.success ? "" : "bg-danger-soft/40"}`}>
                    <td className="px-4 py-3 text-muted sm:px-6">
                      <Link href={href(`/audit-trail/${entry.id}`)} className="whitespace-nowrap hover:underline">
                        {formatDateTime(entry.created_at)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{entry.email || t("auditTrail.unknownAccount")}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        {entry.description}
                        {!entry.success && <Badge tone="danger">{t("auditTrail.outcomeFailed")}</Badge>}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{entry.ip_address ?? "—"}</td>
                    <td className="max-w-64 truncate px-4 py-3 text-xs text-muted sm:px-6" title={entry.user_agent ?? undefined}>{entry.user_agent ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />
    </div>
  );
}
