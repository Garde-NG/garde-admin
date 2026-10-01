"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorState, Icon, type IconName } from "@/components/dashboard/screen-kit";
import { Segmented } from "@/components/ui/segmented";
import { Panel, StatTile } from "@/components/cards/shared";
import { useI18n } from "@/lib/i18n/provider";
import { useCardSchemes, useCardStats, useIssueCount, useJobCount } from "@/lib/query/cards";
import { SCHEMES, addDays, formatMoney, formatNumber, reasonLabel, schemeName, utcToday } from "@/lib/cards/format";
import type { CardScheme, CardStats, CardStatus, MoneyByCurrency } from "@/lib/cards/types";

type Window = "24h" | "7d";

const STATUS_ORDER: CardStatus[] = ["active", "frozen", "terminated"];
const STATUS_FILL: Record<CardStatus, string> = { active: "bg-brand", frozen: "bg-warning", terminated: "bg-muted/45" };
const STATUS_LABEL = { active: "cards.statusActive", frozen: "cards.statusFrozen", terminated: "cards.statusTerminated" } as const;

function sortedCurrencies(money: MoneyByCurrency | undefined) {
  return Object.entries(money ?? {}).sort(([a], [b]) => (a === "NGN" ? -1 : b === "NGN" ? 1 : a.localeCompare(b)));
}

export function CardOverview() {
  const { t, locale } = useI18n();
  const [range, setRange] = useState<Window>("24h");
  const stats = useCardStats();
  const data = stats.data;
  const win = data ? (range === "24h" ? data.last_24h : data.last_7d) : undefined;
  const attempts = win ? win.approved + win.declined : undefined;
  const rate = win && attempts ? (win.approved / attempts) * 100 : undefined;
  const totalCards = data?.cards_by_scheme_status.reduce((sum, row) => sum + row.count, 0);
  const activeCards = data?.cards_by_scheme_status.filter((row) => row.status === "active").reduce((sum, row) => sum + row.count, 0);
  const today = utcToday();
  const activityRange = range === "24h" ? { from: addDays(today, -1), to: today } : { from: addDays(today, -6), to: today };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pages.dashboard")}</h1>
          <p className="mt-1 text-sm text-muted">{t("cardOverview.description")}</p>
        </div>
        <Segmented
          className="sm:w-64"
          label={t("cardOverview.window")}
          value={range}
          onChange={setRange}
          options={[
            { value: "24h", label: t("cardOverview.last24h") },
            { value: "7d", label: t("cardOverview.last7d") },
          ]}
        />
      </header>

      <AttentionStrip />

      {stats.isError ? (
        <section className="rounded-2xl border border-border bg-surface shadow-card"><ErrorState message={stats.error.message} onRetry={() => stats.refetch()} /></section>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label={t("cardOverview.fundsHeld")}
              icon="wallet"
              loading={!data}
              value={<MoneyStack money={data?.funds_held} />}
              sub={t("cardOverview.fundsHeldHint")}
            />
            <StatTile
              label={t("cardOverview.approvedVolume")}
              icon="activity"
              loading={!data}
              value={<MoneyStack money={win?.approved_volume} />}
              sub={range === "24h" ? t("cardOverview.last24h") : t("cardOverview.last7d")}
              href={`/cards/activity?outcome=approved&start_date=${activityRange.from}&end_date=${activityRange.to}`}
            />
            <StatTile
              label={t("cardOverview.approvalRate")}
              icon="check"
              loading={!data}
              value={rate === undefined ? "—" : `${formatNumber(Math.round(rate * 10) / 10, locale)}%`}
              sub={
                win && (
                  <div className="space-y-1.5">
                    {rate !== undefined && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-success-soft" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rate)} aria-label={t("cardOverview.approvalRate")}>
                        <div className="h-full rounded-full bg-success" style={{ width: `${rate}%` }} />
                      </div>
                    )}
                    <p>{t("cardOverview.approvedDeclined").replace("{approved}", formatNumber(win.approved, locale)).replace("{declined}", formatNumber(win.declined, locale))}</p>
                  </div>
                )
              }
            />
            <StatTile
              label={t("cardOverview.cards")}
              icon="card"
              loading={!data}
              value={totalCards === undefined ? "—" : formatNumber(totalCards, locale)}
              sub={data && t("cardOverview.cardsSub").replace("{active}", formatNumber(activeCards ?? 0, locale)).replace("{holders}", formatNumber(data.cardholders, locale))}
              href="/cards"
            />
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-2">
            <SchemeBreakdown stats={data} />
            <DeclineReasons reasons={win?.top_decline_reasons} declined={win?.declined} loading={!data} activityRange={activityRange} />
          </div>
        </>
      )}
    </div>
  );
}

function MoneyStack({ money }: { money: MoneyByCurrency | undefined }) {
  const { locale } = useI18n();
  const entries = sortedCurrencies(money);
  if (entries.length === 0) return <span>—</span>;
  return (
    <span className="block space-y-0.5">
      {entries.map(([currency, amount], index) => (
        <span key={currency} className={`block ${index > 0 ? "text-lg text-muted" : ""}`}>{formatMoney(amount, currency, locale)}</span>
      ))}
    </span>
  );
}

/* ---------- Needs attention ---------- */

function AttentionStrip() {
  const { t } = useI18n();
  const missing = useIssueCount({ status: "open", kind: "missing_locally" }).count;
  const mismatch = useIssueCount({ status: "open", kind: "status_mismatch" }).count;
  const allOpen = useIssueCount({ status: "open" }).count;
  const failed = useJobCount({ status: "failed" }).count;
  const schemes = useCardSchemes();
  const disabled = schemes.data?.filter((scheme) => !scheme.enabled) ?? [];
  const high = missing === undefined || mismatch === undefined ? undefined : missing + mismatch;
  const loaded = high !== undefined && failed !== undefined && allOpen !== undefined && schemes.data;

  const items: { icon: IconName; tone: "danger" | "warning"; title: string; body: string; href: string }[] = [];
  if (high) items.push({ icon: "alert", tone: "danger", title: t(high === 1 ? "cardOverview.highIssuesOne" : "cardOverview.highIssues").replace("{count}", String(high)), body: t("cardOverview.highIssuesBody"), href: "/cards/reconciliation" });
  if (allOpen && high !== undefined && allOpen > high) items.push({ icon: "scale", tone: "warning", title: t(allOpen - high === 1 ? "cardOverview.otherIssuesOne" : "cardOverview.otherIssues").replace("{count}", String(allOpen - high)), body: t("cardOverview.otherIssuesBody"), href: "/cards/reconciliation" });
  if (failed) items.push({ icon: "sync", tone: "danger", title: t(failed === 1 ? "cardOverview.failedJobsOne" : "cardOverview.failedJobs").replace("{count}", String(failed)), body: t("cardOverview.failedJobsBody"), href: "/cards/wallet-sync?status=failed" });
  if (disabled.length) items.push({ icon: "ban", tone: "warning", title: t("cardOverview.schemesDisabled").replace("{names}", disabled.map((scheme) => scheme.name).join(", ")), body: t("cardOverview.schemesDisabledBody"), href: "/configuration/card-schemes" });

  if (!loaded) return <div aria-hidden className="h-[4.5rem] animate-pulse rounded-2xl border border-border bg-subtle/40" />;
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success-soft/60 px-4 py-3 text-sm">
        <Icon name="check" className="size-5 shrink-0 text-success" />
        <p><span className="font-medium text-success">{t("cardOverview.allClear")}</span> <span className="text-muted">{t("cardOverview.allClearBody")}</span></p>
      </div>
    );
  }
  return (
    <section aria-label={t("cardOverview.needsAttention")} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => <AttentionItem key={item.title} {...item} />)}
    </section>
  );
}

function AttentionItem({ icon, tone, title, body, href }: { icon: IconName; tone: "danger" | "warning"; title: string; body: string; href: string }) {
  const { href: localized } = useI18n();
  return (
    <Link href={localized(href)} className={`group flex items-start gap-3 rounded-2xl border bg-surface p-4 shadow-card transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${tone === "danger" ? "border-danger/40" : "border-warning/40"}`}>
      <span aria-hidden className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone === "danger" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
        <Icon name={icon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
      </div>
      <Icon name="arrowRight" className="mt-1 size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

/* ---------- Charts ---------- */

function SchemeBreakdown({ stats }: { stats: CardStats | undefined }) {
  const { href, t, locale } = useI18n();
  const [hover, setHover] = useState<{ scheme: CardScheme; status: CardStatus } | null>(null);
  const rows = SCHEMES.map((scheme) => {
    const counts = Object.fromEntries(STATUS_ORDER.map((status) => [status, stats?.cards_by_scheme_status.find((row) => row.scheme === scheme && row.status === status)?.count ?? 0])) as Record<CardStatus, number>;
    return { scheme, counts, total: STATUS_ORDER.reduce((sum, status) => sum + counts[status], 0) };
  });
  const max = Math.max(1, ...rows.map((row) => row.total));

  return (
    <Panel
      title={t("cardOverview.cardsByScheme")}
      icon="layers"
      actions={
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {STATUS_ORDER.map((status) => (
            <li key={status} className="inline-flex items-center gap-1.5"><span aria-hidden className={`size-2.5 rounded-sm ${STATUS_FILL[status]}`} />{t(STATUS_LABEL[status])}</li>
          ))}
        </ul>
      }
    >
      {!stats ? (
        <div className="space-y-4 p-5">{[0, 1, 2, 3].map((row) => <div key={row} className="h-6 animate-pulse rounded bg-subtle" />)}</div>
      ) : (
        <>
          <ul className="space-y-1 p-3 sm:p-4">
            {rows.map((row) => (
              <li key={row.scheme}>
                <Link href={href(`/cards?scheme=${row.scheme}`)} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3rem] items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-subtle/60">
                  <span className="truncate text-sm">{schemeName(row.scheme)}</span>
                  <span className="relative flex h-6 items-center" onMouseLeave={() => setHover(null)}>
                    {row.total === 0 ? (
                      <span className="h-px w-full bg-border" />
                    ) : (
                      <span className="flex h-full gap-0.5" style={{ width: `${(row.total / max) * 100}%` }}>
                        {STATUS_ORDER.filter((status) => row.counts[status] > 0).map((status, index, list) => (
                          <span
                            key={status}
                            onMouseEnter={() => setHover({ scheme: row.scheme, status })}
                            className={`h-full min-w-1 transition-opacity ${STATUS_FILL[status]} ${index === list.length - 1 ? "rounded-r" : ""} ${hover && (hover.scheme !== row.scheme || hover.status !== status) ? "opacity-50" : ""}`}
                            style={{ flexGrow: row.counts[status] }}
                          />
                        ))}
                      </span>
                    )}
                    {hover?.scheme === row.scheme && (
                      <span role="tooltip" className="pointer-events-none absolute -top-9 left-0 z-10 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-card">
                        {t(STATUS_LABEL[hover.status])}: {formatNumber(row.counts[hover.status], locale)}
                      </span>
                    )}
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums">{formatNumber(row.total, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <table className="sr-only">
            <caption>{t("cardOverview.cardsByScheme")}</caption>
            <thead><tr><th>{t("cards.scheme")}</th>{STATUS_ORDER.map((status) => <th key={status}>{t(STATUS_LABEL[status])}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.scheme}><th>{schemeName(row.scheme)}</th>{STATUS_ORDER.map((status) => <td key={status}>{row.counts[status]}</td>)}</tr>)}</tbody>
          </table>
        </>
      )}
    </Panel>
  );
}

function DeclineReasons({ reasons, declined, loading, activityRange }: { reasons?: { reason: string; count: number }[]; declined?: number; loading: boolean; activityRange: { from: string; to: string } }) {
  const { href, t, locale } = useI18n();
  const list = reasons ?? [];
  const max = Math.max(1, ...list.map((item) => item.count));
  return (
    <Panel
      title={t("cardOverview.topDeclines")}
      icon="ban"
      actions={<Link href={href(`/cards/activity?outcome=declined&start_date=${activityRange.from}&end_date=${activityRange.to}`)} className="text-xs font-medium text-brand hover:underline">{t("cardOverview.viewDeclines")}</Link>}
    >
      {loading ? (
        <div className="space-y-4 p-5">{[0, 1, 2, 3].map((row) => <div key={row} className="h-6 animate-pulse rounded bg-subtle" />)}</div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <Icon name="check" className="size-6 text-success" />
          <p className="mt-2 text-sm font-medium">{t("cardOverview.noDeclines")}</p>
        </div>
      ) : (
        <ul className="space-y-1 p-3 sm:p-4">
          {list.map((item) => {
            const share = declined ? Math.round((item.count / declined) * 100) : undefined;
            return (
              <li key={item.reason}>
                <Link href={href(`/cards/activity?outcome=declined&reason=${item.reason}&start_date=${activityRange.from}&end_date=${activityRange.to}`)} className="group block rounded-lg px-2 py-2 transition hover:bg-subtle/60" title={`${reasonLabel(item.reason, t)}: ${item.count}${share !== undefined ? ` (${share}%)` : ""}`}>
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{reasonLabel(item.reason, t)}</span>
                    <span className="shrink-0 tabular-nums">
                      <span className="font-semibold">{formatNumber(item.count, locale)}</span>
                      {share !== undefined && <span className="ml-1.5 text-xs text-muted">{share}%</span>}
                    </span>
                  </span>
                  <span aria-hidden className="mt-1.5 block h-1.5 rounded-full bg-subtle">
                    <span className="block h-full rounded-full bg-danger/75 transition group-hover:bg-danger" style={{ width: `${(item.count / max) * 100}%` }} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
