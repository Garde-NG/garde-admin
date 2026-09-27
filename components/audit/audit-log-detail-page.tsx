"use client";

import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import { useAuditLog } from "@/lib/query/audit-logs";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "medium" }).format(new Date(value));
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function AuditLogDetailPage({ id }: { id: string }) {
  const { href, t } = useI18n();
  const query = useAuditLog(id);
  const entry = query.data;
  const metadataEntries = entry ? Object.entries(entry.event_metadata ?? {}) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("auditTrail.detailTitle")} />

      {query.isLoading ? (
        <div className="h-64 animate-pulse rounded-xl border border-border bg-subtle/50" />
      ) : query.isError ? (
        <section className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-muted">{query.error.message}</p>
          <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>{t("common.tryAgain")}</Button>
        </section>
      ) : entry ? (
        <section className="space-y-1 rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-lg font-semibold">{entry.description}</h2>
              <p className="text-sm text-muted">{formatDateTime(entry.created_at)}</p>
            </div>
            <Badge tone={entry.success ? "success" : "danger"}>{entry.success ? t("auditTrail.outcomeSuccess") : t("auditTrail.outcomeFailed")}</Badge>
          </div>
          <div className="divide-y divide-border">
            <Row label={t("auditTrail.columnAccount")} value={entry.email || t("auditTrail.unknownAccount")} />
            {entry.user_id && <Row label={t("users.accountId")} value={<span className="font-mono text-xs">{entry.user_id}</span>} />}
            <Row label="Event type" value={<span className="font-mono text-xs">{entry.event_type}</span>} />
            <Row label={t("auditTrail.columnIp")} value={entry.ip_address ?? "—"} />
            <Row label={t("auditTrail.columnDevice")} value={<span className="break-all text-right">{entry.user_agent ?? "—"}</span>} />
          </div>
          <div className="border-t border-border pt-3">
            <h3 className="mb-2 text-sm font-semibold">{t("auditTrail.details")}</h3>
            {metadataEntries.length === 0 ? (
              <p className="text-sm text-muted">{t("auditTrail.noDetails")}</p>
            ) : (
              <dl className="space-y-1.5 rounded-lg bg-subtle p-3">
                {metadataEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 text-sm">
                    <dt className="font-mono text-xs text-muted">{key}</dt>
                    <dd className="break-all text-right font-mono text-xs">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          {entry.user_id && (
            <Link href={href(`/users/${entry.user_id}`)} className="inline-block pt-2 text-sm font-medium text-brand hover:underline">
              {t("users.viewDetails")} →
            </Link>
          )}
        </section>
      ) : null}

      <Link href={href("/audit-trail")} className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-subtle">
        {t("auditTrail.backToList")}
      </Link>
    </div>
  );
}
