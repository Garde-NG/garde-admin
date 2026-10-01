"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfigPageHeader, EmptyState, ErrorState, Icon, SkeletonRows } from "@/components/dashboard/screen-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { FilterChip } from "@/components/cards/shared";
import { useI18n } from "@/lib/i18n/provider";
import { useAdminCard, useJobCount, useWalletSyncJobs, useWalletSyncRun } from "@/lib/query/cards";
import { JOB_KIND_META, JOB_STATUS_META, formatDateTime, formatMoney, formatRelative, shortId } from "@/lib/cards/format";
import { useUrlParams } from "@/lib/use-url-params";
import type { WalletSyncJob, WalletSyncStatus } from "@/lib/cards/types";

const POLL_MS = 3000;
const POLL_WINDOW_MS = 30000;

export function WalletSyncPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { get, setParams, page } = useUrlParams();
  const status = (get("status") || "all") as WalletSyncStatus | "all";
  const cardId = get("card_id");
  const [pollUntil, setPollUntil] = useState(0);
  const run = useWalletSyncRun();

  useEffect(() => {
    if (!pollUntil) return;
    const timer = window.setTimeout(() => setPollUntil(0), Math.max(0, pollUntil - Date.now()));
    return () => window.clearTimeout(timer);
  }, [pollUntil]);

  const interval = pollUntil ? POLL_MS : false;
  const scope = { cardId: cardId || undefined };
  const query = useWalletSyncJobs({ ...scope, page, pageSize: 20, status: status === "all" ? undefined : status }, { refetchInterval: interval });
  const failed = useJobCount({ ...scope, status: "failed" }, { refetchInterval: interval }).count;
  const pending = useJobCount({ ...scope, status: "pending" }, { refetchInterval: interval }).count;
  const done = useJobCount({ ...scope, status: "done" }, { refetchInterval: interval }).count;
  const cancelled = useJobCount({ ...scope, status: "cancelled" }, { refetchInterval: interval }).count;
  const all = [failed, pending, done, cancelled].every((value) => value !== undefined) ? (failed ?? 0) + (pending ?? 0) + (done ?? 0) + (cancelled ?? 0) : undefined;
  const card = useAdminCard(cardId || undefined);
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-5">
      <ConfigPageHeader
        icon="sync"
        showBackLink={false}
        title={t("walletSync.title")}
        description={t("walletSync.description")}
        actions={
          <Button
            loading={run.isPending}
            onClick={() =>
              run.mutate(undefined, {
                onSuccess: () => {
                  toast.success(t("walletSync.runStarted"));
                  setPollUntil(Date.now() + POLL_WINDOW_MS);
                },
                onError: (error) => toast.error(error.message),
              })
            }
          >
            <Icon name="refresh" className={`size-4 ${pollUntil ? "animate-spin" : ""}`} />
            {t("walletSync.runNow")}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <HealthTile
          tone={failed ? "danger" : "success"}
          icon={failed ? "alert" : "check"}
          title={failed ? t(failed === 1 ? "walletSync.healthFailedTitleOne" : "walletSync.healthFailedTitle").replace("{count}", String(failed)) : failed === 0 ? t("walletSync.healthOkTitle") : t("common.loading")}
          body={failed ? t("walletSync.healthFailedBody") : t("walletSync.healthOkBody")}
          action={failed ? <Button variant="secondary" onClick={() => setParams({ status: "failed", page: null })}>{t("walletSync.showFailed")}</Button> : undefined}
          className="sm:col-span-2"
        />
        <HealthTile
          tone={pending ? "warning" : "neutral"}
          icon="clock"
          title={`${pending ?? "–"} ${t("walletSync.statusPending").toLowerCase()}`}
          body={t("walletSync.pendingBody")}
        />
      </div>

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <Segmented
          label={t("common.status")}
          value={status}
          onChange={(value) => setParams({ status: value === "all" ? null : value, page: null })}
          options={[
            { value: "all", label: t("cards.all"), count: all },
            { value: "failed", label: t("walletSync.statusFailed"), count: failed },
            { value: "pending", label: t("walletSync.statusPending"), count: pending },
            { value: "done", label: t("walletSync.statusDone"), count: done },
            { value: "cancelled", label: t("walletSync.statusCancelled"), count: cancelled },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {cardId && <FilterChip label={t("cardActivity.columnCard")} value={card.data ? `${card.data.label} · •••• ${card.data.last4 ?? ""}` : t("common.loading")} onClear={() => setParams({ card_id: null, page: null })} />}
          <p className="flex items-center gap-1.5 text-xs text-muted"><Icon name="info" className="size-3.5" />{t("walletSync.ngnOnly")}</p>
          {query.dataUpdatedAt > 0 && <p className="ml-auto text-xs text-muted">{t("cards.updated")} {formatRelative(new Date(query.dataUpdatedAt).toISOString(), locale)}</p>}
        </div>
      </section>

      <section className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
        {query.isLoading ? (
          <SkeletonRows rows={6} columns={5} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon="sync" title={status === "failed" ? t("walletSync.noFailed") : t("walletSync.empty")}>{t("walletSync.emptyHint")}</EmptyState>
        ) : (
          <JobList items={items} />
        )}
      </section>

      <Pagination page={page} totalPages={query.data?.meta.total_pages ?? 1} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />
    </div>
  );
}

function HealthTile({ tone, icon, title, body, action, className = "" }: { tone: "danger" | "success" | "warning" | "neutral"; icon: "alert" | "check" | "clock"; title: string; body: string; action?: React.ReactNode; className?: string }) {
  const styles = {
    danger: "border-danger/40 [&_[data-icon]]:bg-danger-soft [&_[data-icon]]:text-danger",
    success: "border-border [&_[data-icon]]:bg-success-soft [&_[data-icon]]:text-success",
    warning: "border-warning/40 [&_[data-icon]]:bg-warning-soft [&_[data-icon]]:text-warning",
    neutral: "border-border [&_[data-icon]]:bg-subtle [&_[data-icon]]:text-muted",
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : undefined} className={`flex flex-col gap-3 rounded-2xl border bg-surface p-4 shadow-card sm:flex-row sm:items-center ${styles} ${className}`}>
      <span data-icon aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Icon name={icon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}

export function JobList({ items, showCard = true }: { items: WalletSyncJob[]; showCard?: boolean }) {
  const { t } = useI18n();
  return (
    <>
      <div className="hidden gap-4 bg-subtle/70 px-6 py-3 text-xs font-semibold uppercase text-muted md:grid md:grid-cols-[minmax(0,1.2fr)_8.5rem_minmax(0,1fr)_7rem_9rem]">
        <span>{t("walletSync.columnMovement")}</span>
        <span className="text-right">{t("cardActivity.columnAmount")}</span>
        <span>{showCard ? t("cardActivity.columnCard") : t("walletSync.columnAttempts")}</span>
        <span>{t("common.status")}</span>
        <span>{t("walletSync.columnTiming")}</span>
      </div>
      <ul className="divide-y divide-border">
        {items.map((job) => <JobRow key={job.id} job={job} showCard={showCard} />)}
      </ul>
    </>
  );
}

function JobRow({ job, showCard }: { job: WalletSyncJob; showCard: boolean }) {
  const { href, t, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const kind = JOB_KIND_META[job.kind];
  const status = JOB_STATUS_META[job.status] ?? JOB_STATUS_META.pending;
  const outgoing = job.kind === "sweep_out";
  return (
    <li className={`grid items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-6 md:grid-cols-[minmax(0,1.2fr)_8.5rem_minmax(0,1fr)_7rem_9rem] ${job.status === "failed" ? "bg-danger-soft/30" : ""}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden className={`flex size-9 shrink-0 items-center justify-center rounded-full ${outgoing ? "bg-subtle text-muted" : "bg-brand-soft text-brand"}`}>
          <Icon name={outgoing ? "arrowUpRight" : "arrowDownLeft"} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{kind ? t(kind.label) : job.kind}</p>
          <p className="truncate text-xs text-muted">{kind ? t(kind.hint) : ""}</p>
        </div>
      </div>
      <p className="text-sm font-semibold tabular-nums md:text-right">{formatMoney(job.amount, job.currency, locale)}</p>
      <div className="min-w-0 text-sm">
        {showCard ? (
          <Link href={href(`/cards/${job.card_id}`)} className="inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline">
            {shortId(job.card_id)} <Icon name="arrowRight" className="size-3" />
          </Link>
        ) : null}
        <p className="text-xs text-muted">{t("walletSync.attempts").replace("{count}", String(job.attempts))}</p>
      </div>
      <div><Badge tone={status.tone}>{t(status.label)}</Badge></div>
      <div className="text-xs text-muted">
        <p title={formatDateTime(job.created_at, locale, "medium") ?? undefined}>{t("walletSync.queued")} {formatRelative(job.created_at, locale)}</p>
        {job.done_at && <p title={formatDateTime(job.done_at, locale, "medium") ?? undefined}>{t("walletSync.finished")} {formatRelative(job.done_at, locale)}</p>}
      </div>
      {job.last_error && (
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="flex min-w-0 items-start gap-2 rounded-lg border border-danger/30 bg-surface px-3 py-2 text-left text-xs text-danger md:col-span-5">
          <Icon name="alert" className="mt-px size-3.5 shrink-0" />
          <span className={`min-w-0 break-words font-mono ${expanded ? "" : "line-clamp-1"}`}>{job.last_error}</span>
        </button>
      )}
    </li>
  );
}
