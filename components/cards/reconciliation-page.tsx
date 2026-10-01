"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfigPageHeader, EmptyState, ErrorState, Icon, SkeletonRows } from "@/components/dashboard/screen-kit";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-range-picker";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { useToast } from "@/components/ui/toast";
import { CopyValue, DetailRow } from "@/components/cards/shared";
import { useI18n } from "@/lib/i18n/provider";
import { useIssueCount, useReconciliationActions, useReconciliationIssues } from "@/lib/query/cards";
import { RECON_KINDS, RECON_META, SEVERITY_META, addDays, daysBetween, formatDateTime, formatMoney, formatRelative, shortId, utcToday } from "@/lib/cards/format";
import { useUrlParams } from "@/lib/use-url-params";
import type { ReconciliationIssue, ReconciliationKind, ReconciliationStatus } from "@/lib/cards/types";

const POLL_MS = 5000;
const POLL_WINDOW_MS = 90000;
const SEVERITY_BAR = { high: "bg-danger", medium: "bg-warning", low: "bg-border" } as const;

export function ReconciliationPage() {
  const { t, locale } = useI18n();
  const { get, setParams, page } = useUrlParams();
  const status = (get("status") || "open") as ReconciliationStatus | "all";
  const kind = get("kind") as ReconciliationKind | "";
  const [runOpen, setRunOpen] = useState(false);
  const [selected, setSelected] = useState<ReconciliationIssue | null>(null);
  const [polling, setPolling] = useState<{ until: number; from: string; to: string } | null>(null);

  useEffect(() => {
    if (!polling) return;
    const timer = window.setTimeout(() => setPolling(null), Math.max(0, polling.until - Date.now()));
    return () => window.clearTimeout(timer);
  }, [polling]);

  const interval = polling ? POLL_MS : false;
  const query = useReconciliationIssues({ page, pageSize: 20, status: status === "all" ? undefined : status, kind: kind || undefined }, { refetchInterval: interval });
  const counts = {
    missing_locally: useIssueCount({ status: "open", kind: "missing_locally" }, { refetchInterval: interval }).count,
    status_mismatch: useIssueCount({ status: "open", kind: "status_mismatch" }, { refetchInterval: interval }).count,
    amount_mismatch: useIssueCount({ status: "open", kind: "amount_mismatch" }, { refetchInterval: interval }).count,
    missing_at_sudo: useIssueCount({ status: "open", kind: "missing_at_sudo" }, { refetchInterval: interval }).count,
  } satisfies Record<ReconciliationKind, number | undefined>;
  const items = query.data?.items ?? [];

  return (
    <div className="space-y-5">
      <ConfigPageHeader
        icon="scale"
        showBackLink={false}
        title={t("reconciliation.title")}
        description={t("reconciliation.description")}
        actions={<Button onClick={() => setRunOpen(true)}><Icon name="play" className="size-4" />{t("reconciliation.run")}</Button>}
      />

      {polling && (
        <div role="status" className="flex animate-fade-in items-start gap-3 rounded-2xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm">
          <span aria-hidden className="mt-0.5 size-4 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <div className="min-w-0">
            <p className="font-medium text-brand">{t("reconciliation.runningTitle")}</p>
            <p className="mt-0.5 text-muted">
              {t("reconciliation.runningBody").replace("{from}", polling.from).replace("{to}", polling.to)}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {RECON_KINDS.map((value) => {
          const meta = RECON_META[value];
          const severity = SEVERITY_META[meta.severity];
          const count = counts[value];
          const active = kind === value && status === "open";
          const alarming = meta.severity !== "low" && (count ?? 0) > 0;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setParams(active ? { kind: null, page: null } : { kind: value, status: null, page: null })}
              className={`group relative overflow-hidden rounded-2xl border bg-surface p-4 text-left shadow-card transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                active ? "border-brand ring-3 ring-brand/15" : alarming && meta.severity === "high" ? "border-danger/40" : alarming ? "border-warning/40" : "border-border"
              }`}
            >
              <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${SEVERITY_BAR[meta.severity]}`} />
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{t(meta.label)}</p>
                <Badge tone={severity.tone}>{t(severity.label)}</Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {count === undefined ? <span aria-hidden className="inline-block h-7 w-10 animate-pulse rounded bg-subtle align-middle" /> : count}
                <span className="ml-1.5 text-xs font-normal text-muted">{t("reconciliation.open")}</span>
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{t(meta.meaning)}</p>
            </button>
          );
        })}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center">
        <Segmented
          className="sm:w-80"
          label={t("common.status")}
          value={status}
          onChange={(value) => setParams({ status: value === "open" ? null : value, page: null })}
          options={[
            { value: "open", label: t("reconciliation.open") },
            { value: "resolved", label: t("reconciliation.resolved") },
            { value: "all", label: t("cards.all") },
          ]}
        />
        <div className="sm:w-64">
          <Select label={t("reconciliation.kind")} hideLabel value={kind} onChange={(event) => setParams({ kind: event.target.value || null, page: null })}>
            <option value="">{t("reconciliation.allKinds")}</option>
            {RECON_KINDS.map((value) => <option key={value} value={value}>{t(RECON_META[value].label)}</option>)}
          </Select>
        </div>
        {query.dataUpdatedAt > 0 && <p className="text-xs text-muted sm:ml-auto">{t("cards.updated")} {formatRelative(new Date(query.dataUpdatedAt).toISOString(), locale)}</p>}
      </section>

      <section className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
        {query.isLoading ? (
          <SkeletonRows rows={6} columns={4} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          status === "open" ? (
            <EmptyState icon="check" title={t("reconciliation.allClear")} action={<Button variant="secondary" onClick={() => setRunOpen(true)}>{t("reconciliation.run")}</Button>}>
              {t("reconciliation.allClearHint")}
            </EmptyState>
          ) : (
            <EmptyState icon="scale" title={t("reconciliation.empty")}>{t("common.tryAnotherSearch")}</EmptyState>
          )
        ) : (
          <IssueList items={items} onSelect={setSelected} />
        )}
      </section>

      <Pagination page={page} totalPages={query.data?.meta.total_pages ?? 1} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />

      <RunReconciliationModal
        open={runOpen}
        onClose={() => setRunOpen(false)}
        onStarted={(range) => {
          setPolling({ until: Date.now() + POLL_WINDOW_MS, from: range.from, to: range.to });
          if (status !== "open") setParams({ status: null, page: null });
        }}
      />
      <IssueModal issue={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export function IssueList({ items, onSelect, showCard = true }: { items: ReconciliationIssue[]; onSelect: (issue: ReconciliationIssue) => void; showCard?: boolean }) {
  const { t, locale } = useI18n();
  return (
    <ul className="divide-y divide-border">
      {items.map((issue) => {
        const meta = RECON_META[issue.kind] ?? RECON_META.missing_at_sudo;
        const summary = summarize(issue.details, locale);
        return (
          <li key={issue.id} className="relative">
            <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${issue.status === "resolved" ? "bg-transparent" : SEVERITY_BAR[meta.severity]}`} />
            <button type="button" onClick={() => onSelect(issue)} className="grid w-full items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition hover:bg-subtle/50 focus-visible:bg-subtle/50 focus-visible:outline-none sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem_7rem_1rem]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{t(meta.label)}</p>
                  {issue.status === "open" && <Badge tone={SEVERITY_META[meta.severity].tone}>{t(SEVERITY_META[meta.severity].label)}</Badge>}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">{t(meta.meaning)}</p>
              </div>
              <div className="min-w-0 text-sm">
                <p className="truncate font-mono">{summary.merchant ?? "—"}</p>
                <p className="truncate text-xs text-muted">
                  {summary.amount ?? ""}
                  {showCard && issue.card_id ? `${summary.amount ? " · " : ""}${t("reconciliation.card")} ${shortId(issue.card_id)}` : ""}
                </p>
              </div>
              <time dateTime={issue.detected_at} title={formatDateTime(issue.detected_at, locale, "medium") ?? undefined} className="text-xs text-muted md:text-sm">
                {formatRelative(issue.detected_at, locale)}
              </time>
              <div>{issue.status === "resolved" ? <Badge tone="success">{t("reconciliation.resolved")}</Badge> : <Badge tone="neutral">{t("reconciliation.open")}</Badge>}</div>
              <Icon name="chevronRight" className="hidden size-4 text-muted md:block" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Details ---------- */

type Side = Record<string, unknown>;

function isRecord(value: unknown): value is Side {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function summarize(details: Record<string, unknown>, locale: string) {
  const sides = [details.ours, details.sudo, details].filter(isRecord);
  const merchant = sides.map((side) => side.merchant ?? side.merchant_name).find((value) => typeof value === "string") as string | undefined;
  const amountSide = sides.find((side) => typeof side.amount === "number");
  const amount = amountSide ? formatMoney(amountSide.amount as number, typeof amountSide.currency === "string" ? amountSide.currency : null, locale) : undefined;
  return { merchant, amount };
}

function useFormatValue() {
  const { t, locale } = useI18n();
  return (key: string, value: unknown, side: Side): string => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "number" && /amount|balance|fee/i.test(key)) return formatMoney(value, typeof side.currency === "string" ? side.currency : null, locale);
    if (typeof value === "boolean") return key === "approved" ? (value ? t("cardActivity.approved") : t("cardActivity.declined")) : value ? t("common.yes") : t("common.no");
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value, locale, "medium") ?? value;
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };
}

function humanKey(key: string) {
  return key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function Comparison({ details }: { details: Record<string, unknown> }) {
  const { t } = useI18n();
  const format = useFormatValue();
  const ours = isRecord(details.ours) ? details.ours : null;
  const sudo = isRecord(details.sudo) ? details.sudo : null;
  const rest = Object.entries(details).filter(([key]) => key !== "ours" && key !== "sudo");

  return (
    <div className="space-y-3">
      {(ours || sudo) && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-subtle/70 text-xs font-semibold uppercase text-muted">
              <tr>
                <th scope="col" className="w-1/3 px-3 py-2 text-left">{t("reconciliation.field")}</th>
                <th scope="col" className="px-3 py-2 text-left">{t("reconciliation.ours")}</th>
                <th scope="col" className="px-3 py-2 text-left">{t("reconciliation.issuer")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from(new Set([...Object.keys(ours ?? {}), ...Object.keys(sudo ?? {})])).map((key) => {
                const left = ours ? format(key, ours[key], ours) : null;
                const right = sudo ? format(key, sudo[key], sudo) : null;
                const differs = ours && sudo && left !== right;
                return (
                  <tr key={key} className={differs ? "bg-warning-soft/60" : ""}>
                    <th scope="row" className="px-3 py-2 text-left font-normal text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        {humanKey(key)}
                        {differs && <span className="sr-only">({t("reconciliation.differs")})</span>}
                        {differs && <Icon name="alert" className="size-3.5 text-warning" />}
                      </span>
                    </th>
                    <td className="break-words px-3 py-2 font-medium">{left ?? <span className="text-muted">{t("reconciliation.noRecord")}</span>}</td>
                    <td className="break-words px-3 py-2 font-medium">{right ?? <span className="text-muted">{t("reconciliation.noRecord")}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {rest.length > 0 && (
        <dl className="divide-y divide-border rounded-xl border border-border px-3">
          {rest.map(([key, value]) => <DetailRow key={key} label={humanKey(key)}>{format(key, value, details)}</DetailRow>)}
        </dl>
      )}
    </div>
  );
}

export function IssueModal({ issue, onClose }: { issue: ReconciliationIssue | null; onClose: () => void }) {
  const { href, t, locale } = useI18n();
  const toast = useToast();
  const { resolve } = useReconciliationActions();
  const [note, setNote] = useState("");
  const [current, setCurrent] = useState<ReconciliationIssue | null>(issue);
  const [lastIssue, setLastIssue] = useState(issue);

  if (issue !== lastIssue) {
    setLastIssue(issue);
    if (issue) {
      setCurrent(issue);
      setNote("");
    }
  }

  const shown = issue ? current : null;
  const meta = shown ? RECON_META[shown.kind] ?? RECON_META.missing_at_sudo : null;
  const trimmed = note.trim();
  const close = () => !resolve.isPending && onClose();

  return (
    <Modal open={Boolean(issue)} onClose={close} title={meta ? t(meta.label) : t("reconciliation.title")} size="lg">
      {shown && meta && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {shown.status === "open" ? <Badge tone={SEVERITY_META[meta.severity].tone}>{t(SEVERITY_META[meta.severity].label)}</Badge> : <Badge tone="success">{t("reconciliation.resolved")}</Badge>}
            <span className="text-xs text-muted">{t("reconciliation.detected")} {formatDateTime(shown.detected_at, locale, "medium")}</span>
          </div>
          <p className="text-sm leading-relaxed">{t(meta.meaning)}</p>
          {shown.status === "open" && (
            <Alert tone={meta.severity === "high" ? "error" : meta.severity === "medium" ? "warning" : "info"}>
              <p className="font-medium">{t("reconciliation.whatToDo")}</p>
              <p className="mt-0.5 opacity-90">{t(meta.action)}</p>
            </Alert>
          )}

          <Comparison details={shown.details} />

          <dl className="divide-y divide-border rounded-xl border border-border px-3">
            <DetailRow label={t("reconciliation.card")}>
              {shown.card_id ? (
                <Link href={href(`/cards/${shown.card_id}`)} className="inline-flex items-center gap-1 text-brand hover:underline">
                  {shortId(shown.card_id)} <Icon name="arrowRight" className="size-3.5" />
                </Link>
              ) : "—"}
            </DetailRow>
            <DetailRow label={t("reconciliation.issuerCardId")}><CopyValue value={shown.sudo_card_id} mono /></DetailRow>
            <DetailRow label={t("reconciliation.issuerAuthorizationId")}><CopyValue value={shown.sudo_authorization_id} mono /></DetailRow>
            <DetailRow label={t("reconciliation.issueId")}><CopyValue value={shown.id} display={shortId(shown.id)} mono /></DetailRow>
          </dl>

          {shown.status === "resolved" ? (
            <div className="rounded-xl border border-success/30 bg-success-soft/50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-success"><Icon name="check" className="size-4" />{t("reconciliation.resolvedOn")} {formatDateTime(shown.resolved_at, locale)}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">{shown.resolution_note}</p>
            </div>
          ) : (
            <form
              id="resolve-issue"
              onSubmit={(event) => {
                event.preventDefault();
                if (trimmed.length < 3) return;
                resolve.mutate(
                  { id: shown.id, note: trimmed },
                  {
                    onSuccess: (updated) => {
                      toast.success(t("reconciliation.resolveSuccess"));
                      setCurrent(updated);
                    },
                    onError: (error) => toast.error(error.message),
                  },
                );
              }}
            >
              <TextArea
                label={t("reconciliation.resolutionNote")}
                hint={t("reconciliation.resolutionNoteHint")}
                placeholder={t("reconciliation.resolutionNotePlaceholder")}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                minLength={3}
                maxLength={500}
                showCount
                required
              />
            </form>
          )}

          <ModalActions>
            <Button variant="secondary" onClick={close} disabled={resolve.isPending}>{t("common.close")}</Button>
            {shown.status === "open" && (
              <Button type="submit" form="resolve-issue" loading={resolve.isPending} disabled={trimmed.length < 3}>
                <Icon name="check" className="size-4" />{t("reconciliation.markResolved")}
              </Button>
            )}
          </ModalActions>
        </div>
      )}
    </Modal>
  );
}

/* ---------- Run ---------- */

function RunReconciliationModal({ open, onClose, onStarted }: { open: boolean; onClose: () => void; onStarted: (range: { from: string; to: string }) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { run } = useReconciliationActions();
  const today = utcToday();
  const [from, setFrom] = useState(addDays(today, -1));
  const [to, setTo] = useState(today);

  const span = from && to ? daysBetween(from, to) : 0;
  const error = !from || !to ? t("reconciliation.rangeRequired") : to > today ? t("reconciliation.rangeFuture") : span < 0 ? t("reconciliation.rangeReversed") : span > 31 ? t("reconciliation.rangeTooLong") : null;
  const presets: [string, number][] = [[t("dateRangePicker.today"), 0], [t("reconciliation.last2Days"), 1], [t("dateRangePicker.last7Days"), 6], [t("reconciliation.last31Days"), 30]];

  return (
    <Modal open={open} onClose={() => !run.isPending && onClose()} title={t("reconciliation.runTitle")}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (error) return;
          run.mutate(
            { from, to },
            {
              onSuccess: () => {
                toast.success(t("reconciliation.runStarted"));
                onStarted({ from, to });
                onClose();
              },
              onError: (failure) => toast.error(failure.message),
            },
          );
        }}
      >
        <p className="text-sm text-muted">{t("reconciliation.runBody")}</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map(([label, days]) => {
            const active = to === today && from === addDays(today, -days);
            return (
              <button key={label} type="button" aria-pressed={active} onClick={() => { setFrom(addDays(today, -days)); setTo(today); }} className={`h-8 rounded-full border px-3 text-xs font-medium transition ${active ? "border-brand bg-brand-soft text-brand" : "border-border text-muted hover:bg-subtle hover:text-foreground"}`}>
                {label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePicker label={t("reconciliation.fromDate")} value={from} onChange={setFrom} />
          <DatePicker label={t("reconciliation.toDate")} value={to} onChange={setTo} />
        </div>
        {error ? <p className="text-xs text-danger" role="alert">{error}</p> : <p className="text-xs text-muted">{t("reconciliation.runHint")}</p>}
        <ModalActions>
          <Button variant="secondary" onClick={onClose} disabled={run.isPending}>{t("common.cancel")}</Button>
          <Button type="submit" loading={run.isPending} disabled={Boolean(error)}>
            <Icon name="play" className="size-4" />{t("reconciliation.startRun")}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
