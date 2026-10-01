"use client";

import { ConfigPageHeader, EmptyState, ErrorState, SkeletonRows } from "@/components/dashboard/screen-kit";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { ActivityList } from "@/components/cards/activity-list";
import { FilterChip } from "@/components/cards/shared";
import { useI18n } from "@/lib/i18n/provider";
import { useAdminCard, useCardActivity } from "@/lib/query/cards";
import { useAdminUser } from "@/lib/query/users";
import { DECLINE_REASONS, SCHEMES, addDays, formatNumber, reasonLabel, schemeName, utcToday } from "@/lib/cards/format";
import { useUrlParams } from "@/lib/use-url-params";
import type { CardScheme } from "@/lib/cards/types";

type Outcome = "all" | "approved" | "declined";

export function CardActivityPage() {
  const { t, locale } = useI18n();
  const { get, setParams, page } = useUrlParams();
  const today = utcToday();
  const startDate = get("start_date") || addDays(today, -6);
  const endDate = get("end_date") || today;
  const outcome = (get("outcome") || "all") as Outcome;
  const scheme = get("scheme") as CardScheme | "";
  const reason = get("reason");
  const cardId = get("card_id");
  const userId = get("user_id");

  const base = { startDate, endDate, scheme: scheme || undefined, reason: reason || undefined, cardId: cardId || undefined, userId: userId || undefined };
  const query = useCardActivity({ ...base, page, pageSize: 25, approved: outcome === "all" ? undefined : outcome === "approved" });
  // One-row pages are enough to read the approved/declined totals for the same filters.
  const approvedCount = useCardActivity({ ...base, page: 1, pageSize: 1, approved: true }, { enabled: !reason });
  const declinedCount = useCardActivity({ ...base, page: 1, pageSize: 1, approved: false });
  const card = useAdminCard(cardId || undefined);
  const owner = useAdminUser(userId || undefined);

  const approved = reason ? 0 : approvedCount.data?.meta.total_items;
  const declined = declinedCount.data?.meta.total_items;
  const total = approved !== undefined && declined !== undefined ? approved + declined : undefined;
  const rate = total ? Math.round(((approved ?? 0) / total) * 1000) / 10 : undefined;
  const items = query.data?.items ?? [];
  const filtered = Boolean(scheme || reason || cardId || userId || outcome !== "all");

  return (
    <div className="space-y-5">
      <ConfigPageHeader icon="activity" showBackLink={false} title={t("cardActivity.title")} description={t("cardActivity.description")} />

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)_11rem_14rem]">
          <DateRangePicker compact allowAll={false} from={startDate} to={endDate} onApply={(range) => setParams({ start_date: range.from, end_date: range.to || range.from, page: null })} />
          <Segmented
            label={t("cardActivity.columnOutcome")}
            value={outcome}
            onChange={(value) => setParams({ outcome: value === "all" ? null : value, reason: value === "approved" ? null : reason || null, page: null })}
            options={[
              { value: "all", label: t("cards.all"), count: total },
              { value: "approved", label: t("cardActivity.approved"), count: reason ? undefined : approved },
              { value: "declined", label: t("cardActivity.declined"), count: declined },
            ]}
          />
          <Select label={t("cards.scheme")} hideLabel value={scheme} onChange={(event) => setParams({ scheme: event.target.value || null, page: null })}>
            <option value="">{t("cards.allSchemes")}</option>
            {SCHEMES.map((code) => <option key={code} value={code}>{schemeName(code)}</option>)}
          </Select>
          <Select label={t("cardActivity.reason")} hideLabel value={reason} disabled={outcome === "approved"} onChange={(event) => setParams({ reason: event.target.value || null, outcome: event.target.value ? "declined" : outcome === "all" ? null : outcome, page: null })}>
            <option value="">{t("cardActivity.anyReason")}</option>
            {DECLINE_REASONS.map((value) => <option key={value} value={value}>{reasonLabel(value, t)}</option>)}
          </Select>
        </div>
        {(cardId || userId || filtered) && (
          <div className="flex flex-wrap items-center gap-2">
            {cardId && <FilterChip label={t("cardActivity.columnCard")} value={card.data ? `${card.data.label} · •••• ${card.data.last4 ?? ""}` : t("common.loading")} onClear={() => setParams({ card_id: null, page: null })} />}
            {userId && <FilterChip label={t("cards.owner")} value={owner.data?.email ?? t("common.loading")} onClear={() => setParams({ user_id: null, page: null })} />}
            {filtered && (
              <button type="button" onClick={() => setParams({ outcome: null, scheme: null, reason: null, card_id: null, user_id: null, page: null })} className="h-8 rounded-full px-3 text-xs font-medium text-muted transition hover:bg-subtle hover:text-foreground">
                {t("cards.clearAll")}
              </button>
            )}
          </div>
        )}
        {rate !== undefined && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-sm">
            <span className="text-muted">{t("cardActivity.approvalRate")}</span>
            <div className="flex min-w-40 flex-1 items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-success-soft" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rate} aria-label={t("cardActivity.approvalRate")}>
                <div className="h-full rounded-full bg-success" style={{ width: `${rate}%` }} />
              </div>
              <span className="font-semibold tabular-nums">{formatNumber(rate, locale)}%</span>
            </div>
            <span className="text-xs text-muted">{t(total === 1 ? "cardActivity.rangeTotalOne" : "cardActivity.rangeTotal").replace("{count}", formatNumber(total ?? 0, locale))}</span>
          </div>
        )}
      </section>

      <section className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
        {query.isLoading ? (
          <SkeletonRows rows={8} columns={5} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon="activity" title={t("cardActivity.empty")}>{t("cardActivity.emptyHint")}</EmptyState>
        ) : (
          <ActivityList items={items} onFilterCard={(id) => setParams({ card_id: id, page: null })} />
        )}
      </section>

      <Pagination page={page} totalPages={query.data?.meta.total_pages ?? 1} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />
    </div>
  );
}
