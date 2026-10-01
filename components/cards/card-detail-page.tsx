"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfigPageHeader, EmptyState, ErrorState, Icon, SkeletonRows } from "@/components/dashboard/screen-kit";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { TextArea } from "@/components/ui/text-area";
import { useToast } from "@/components/ui/toast";
import { ActivityList } from "@/components/cards/activity-list";
import { IssueList, IssueModal } from "@/components/cards/reconciliation-page";
import { JobList } from "@/components/cards/wallet-sync-page";
import { CardFace, CardStatusBadge, CopyValue, DetailRow, Money, Panel, SchemeChip } from "@/components/cards/shared";
import { useI18n } from "@/lib/i18n/provider";
import { useAdminCard, useCardActions, useCardActivity, useIssueCount, useJobCount, useReconciliationIssues, useWalletComparison, useWalletSyncJobs } from "@/lib/query/cards";
import { FREEZE_SOURCE_LABEL, addDays, formatDateTime, formatMoney, formatRelative, shortId, utcToday } from "@/lib/cards/format";
import { useUrlParams } from "@/lib/use-url-params";
import type { AdminCard, ReconciliationIssue } from "@/lib/cards/types";

type Tab = "activity" | "sync" | "reconciliation";

export function CardDetailPage({ id }: { id: string }) {
  const { href, t, locale } = useI18n();
  const query = useAdminCard(id);
  const { get, setParams } = useUrlParams();
  const tab = (get("tab") || "activity") as Tab;
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [unfreezeOpen, setUnfreezeOpen] = useState(false);
  const openIssues = useIssueCount({ status: "open", cardId: id }).count;
  const failedJobs = useJobCount({ status: "failed", cardId: id }).count;
  const card = query.data;

  return (
    <div className="space-y-5">
      <ConfigPageHeader icon="card" title={card?.label ?? t("cards.detailTitle")} backHref="/cards" backLabel={t("cards.title")} description={card ? `${card.user_name} · ${card.user_email}` : undefined} />

      {query.isLoading ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-subtle/40" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-subtle/40" />
        </div>
      ) : query.isError ? (
        <section className="rounded-2xl border border-border bg-surface shadow-card">
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        </section>
      ) : card ? (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
              <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-center">
                <CardFace card={card} />
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardStatusBadge status={card.status} freezeSource={card.freeze_source} />
                    <SchemeChip scheme={card.scheme} className="text-muted" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">{t("cards.balance")}</p>
                    <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatMoney(card.balance, card.currency, locale)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {card.status === "active" && (
                      <Button variant="danger" onClick={() => setFreezeOpen(true)}><Icon name="snowflake" className="size-4" />{t("cards.freeze")}</Button>
                    )}
                    {card.status === "frozen" && (
                      <>
                        <Button onClick={() => setUnfreezeOpen(true)}><Icon name="unlock" className="size-4" />{t("cards.unfreeze")}</Button>
                        {card.freeze_source === "user" && (
                          <Button variant="secondary" onClick={() => setFreezeOpen(true)}><Icon name="lock" className="size-4" />{t("cards.escalate")}</Button>
                        )}
                      </>
                    )}
                    <Link href={href(`/cards/activity?card_id=${card.id}`)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-subtle pointer-coarse:h-11">
                      <Icon name="activity" className="size-4" />{t("cards.allActivity")}
                    </Link>
                  </div>
                </div>
              </div>
              {card.status === "frozen" && <FreezeNotice card={card} />}
              {card.status === "terminated" && (
                <div className="mt-5"><Alert tone="info">{t("cards.terminatedNotice")}</Alert></div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
              <div className="px-2 sm:px-3">
                <Tabs
                  label={t("cards.detailTitle")}
                  value={tab}
                  onChange={(value) => setParams({ tab: value === "activity" ? null : value, page: null })}
                  items={[
                    { value: "activity", label: t("cards.tabActivity") },
                    { value: "sync", label: t("cards.tabSync"), badge: failedJobs ? <Badge tone="danger">{failedJobs}</Badge> : undefined },
                    { value: "reconciliation", label: t("cards.tabReconciliation"), badge: openIssues ? <Badge tone="warning">{openIssues}</Badge> : undefined },
                  ]}
                />
              </div>
              {tab === "activity" && <CardActivityTab cardId={card.id} />}
              {tab === "sync" && <CardJobsTab cardId={card.id} />}
              {tab === "reconciliation" && <CardIssuesTab cardId={card.id} />}
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20">
            <WalletCheck card={card} />

            <Panel title={t("cards.owner")} icon="user">
              <div className="space-y-3 px-4 py-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{(card.user_name || card.user_email).charAt(0).toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{card.user_name}</p>
                    <p className="truncate text-xs text-muted"><CopyValue value={card.user_email} /></p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={href(`/users/${card.user_id}`)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium transition hover:bg-subtle">{t("cards.profile")}</Link>
                  <Link href={href(`/cards?user_id=${card.user_id}`)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium transition hover:bg-subtle">{t("cards.allCards")}</Link>
                </div>
              </div>
            </Panel>

            <Panel title={t("cards.details")} icon="card">
              <dl className="divide-y divide-border px-4 sm:px-5">
                <DetailRow label={t("cards.cardId")}><CopyValue value={card.id} display={shortId(card.id)} mono /></DetailRow>
                <DetailRow label={t("cards.number")}><span className="font-mono">•••• {card.last4 ?? "····"}</span></DetailRow>
                <DetailRow label={t("cards.scheme")}><SchemeChip scheme={card.scheme} /></DetailRow>
                <DetailRow label={t("cards.currency")}>{card.currency}</DetailRow>
                <DetailRow label={t("cards.issued")}>{formatDateTime(card.created_at, locale)}</DetailRow>
              </dl>
            </Panel>
          </aside>
        </div>
      ) : null}

      {card && <FreezeModal card={card} open={freezeOpen} onClose={() => setFreezeOpen(false)} />}
      {card && <UnfreezeModal card={card} open={unfreezeOpen} onClose={() => setUnfreezeOpen(false)} />}
    </div>
  );
}

function FreezeNotice({ card }: { card: AdminCard }) {
  const { t } = useI18n();
  const source = card.freeze_source;
  const explanation = source === "user" ? t("cards.frozenByUserHint") : source === "scheme_disabled" ? t("cards.frozenBySchemeHint") : t("cards.frozenByAdminHint");
  return (
    <div className="mt-5">
      <Alert tone={source === "user" ? "info" : "warning"}>
        <p className="font-medium">{t("cards.frozenBy")} {source ? t(FREEZE_SOURCE_LABEL[source]).toLowerCase() : "—"}</p>
        <p className="mt-0.5 opacity-90">{explanation}</p>
        {card.freeze_reason && <p className="mt-2 text-foreground"><span className="text-muted">{t("cards.reason")}: </span>{card.freeze_reason}</p>}
      </Alert>
    </div>
  );
}

function FreezeModal({ card, open, onClose }: { card: AdminCard; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { freeze } = useCardActions();
  const [reason, setReason] = useState("");
  const escalating = card.status === "frozen" && card.freeze_source === "user";
  const close = () => {
    if (freeze.isPending) return;
    setReason("");
    onClose();
  };
  return (
    <Modal open={open} onClose={close} title={escalating ? t("cards.escalateTitle") : t("cards.freezeTitle")}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          freeze.mutate(
            { id: card.id, reason: reason.trim() || undefined },
            { onSuccess: () => { toast.success(t("cards.freezeSuccess")); setReason(""); onClose(); }, onError: (error) => toast.error(error.message) },
          );
        }}
      >
        <p className="text-sm text-muted">{escalating ? t("cards.escalateBody") : t("cards.freezeBody")}</p>
        <ul className="space-y-1.5 text-sm">
          <li className="flex gap-2"><Icon name="bell" className="mt-0.5 size-4 shrink-0 text-muted" />{t("cards.freezeEffectNotify")}</li>
          <li className="flex gap-2"><Icon name="lock" className="mt-0.5 size-4 shrink-0 text-muted" />{t("cards.freezeEffectLock")}</li>
          <li className="flex gap-2"><Icon name="shield" className="mt-0.5 size-4 shrink-0 text-muted" />{t("cards.freezeEffectAudit")}</li>
        </ul>
        <TextArea label={t("cards.reason")} hint={t("cards.reasonHint")} placeholder={t("cards.freezeReasonPlaceholder")} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={255} showCount rows={3} />
        <ModalActions>
          <Button variant="secondary" onClick={close} disabled={freeze.isPending}>{t("common.cancel")}</Button>
          <Button type="submit" variant="danger" loading={freeze.isPending}><Icon name="snowflake" className="size-4" />{escalating ? t("cards.escalate") : t("cards.freeze")}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

function UnfreezeModal({ card, open, onClose }: { card: AdminCard; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { unfreeze } = useCardActions();
  return (
    <Modal open={open} onClose={() => !unfreeze.isPending && onClose()} title={t("cards.unfreezeTitle")}>
      <p className="text-sm text-muted">{t("cards.unfreezeBody")}</p>
      {card.freeze_source === "scheme_disabled" && <Alert tone="warning">{t("cards.unfreezeSchemeWarning")}</Alert>}
      {card.freeze_reason && (
        <p className="rounded-lg bg-subtle px-3 py-2 text-sm"><span className="text-muted">{t("cards.reason")}: </span>{card.freeze_reason}</p>
      )}
      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={unfreeze.isPending}>{t("common.cancel")}</Button>
        <Button
          loading={unfreeze.isPending}
          onClick={() => unfreeze.mutate(card.id, { onSuccess: () => { toast.success(t("cards.unfreezeSuccess")); onClose(); }, onError: (error) => toast.error(error.message) })}
        >
          <Icon name="unlock" className="size-4" />{t("cards.unfreeze")}
        </Button>
      </ModalActions>
    </Modal>
  );
}

/** Reads the issuer's live wallet, so it only runs on demand. */
function WalletCheck({ card }: { card: AdminCard }) {
  const { t, locale } = useI18n();
  const [requested, setRequested] = useState(false);
  const check = useWalletComparison(card.id, requested);
  const data = check.data;
  const mirrored = card.currency === "NGN";

  return (
    <Panel
      title={t("cards.issuerWallet")}
      icon="wallet"
      actions={
        requested && (
          <button type="button" disabled={check.isFetching} onClick={() => check.refetch()} title={t("cards.recheck")} aria-label={t("cards.recheck")} className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-subtle hover:text-foreground disabled:opacity-50">
            <Icon name="refresh" className={`size-4 ${check.isFetching ? "animate-spin" : ""}`} />
          </button>
        )
      }
      footer={mirrored ? t("cards.issuerWalletHint") : t("cards.issuerWalletUsdHint")}
    >
      <div className="px-4 py-4 sm:px-5">
        {!requested ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">{t("cards.issuerWalletIntro")}</p>
            <Button variant="secondary" fullWidth onClick={() => setRequested(true)}><Icon name="scale" className="size-4" />{t("cards.compareBalances")}</Button>
          </div>
        ) : check.isLoading ? (
          <div role="status" aria-label={t("common.loading")} className="space-y-2.5">
            {[0, 1, 2].map((row) => <div key={row} className="h-5 animate-pulse rounded bg-subtle" />)}
          </div>
        ) : check.isError ? (
          <div className="space-y-3">
            <Alert tone="error">{check.error.message}</Alert>
            <Button variant="secondary" fullWidth onClick={() => check.refetch()}>{t("common.tryAgain")}</Button>
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className={`flex items-center gap-3 rounded-xl p-3 ${data.in_sync ? "bg-success-soft text-success" : mirrored ? "bg-danger-soft text-danger" : "bg-subtle text-muted"}`}>
              <Icon name={data.in_sync ? "check" : "alert"} className="size-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{data.in_sync ? t("cards.inSync") : t("cards.outOfSync")}</p>
                {!data.in_sync && <p className="text-xs">{t("cards.drift")}: {formatMoney(data.drift, data.currency, locale, { signed: true })}</p>}
              </div>
            </div>
            <dl className="divide-y divide-border">
              <DetailRow label={t("cards.ledgerBalance")}><Money amount={data.ledger_balance} currency={data.currency} /></DetailRow>
              <DetailRow label={t("cards.issuerBalance")}><Money amount={data.sudo_wallet_balance} currency={data.currency} /></DetailRow>
              <DetailRow label={t("cards.pendingMoves")}>{formatMoney(data.pending_net, data.currency, locale, { signed: true })}</DetailRow>
              <DetailRow label={t("cards.expectedAfterPending")}><Money amount={data.expected_wallet_after_pending} currency={data.currency} /></DetailRow>
            </dl>
            <p className="text-xs text-muted">{t("cards.checked")} {formatRelative(new Date(check.dataUpdatedAt).toISOString(), locale)}</p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function CardActivityTab({ cardId }: { cardId: string }) {
  const { t } = useI18n();
  const today = utcToday();
  const [range, setRange] = useState({ from: addDays(today, -29), to: today });
  const [page, setPage] = useState(1);
  const query = useCardActivity({ cardId, startDate: range.from, endDate: range.to, page, pageSize: 15 });
  const items = query.data?.items ?? [];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="w-full sm:w-72">
          <DateRangePicker compact allowAll={false} from={range.from} to={range.to} onApply={(next) => { setRange({ from: next.from, to: next.to || next.from }); setPage(1); }} />
        </div>
        {query.data && <p className="text-xs text-muted">{t(query.data.meta.total_items === 1 ? "cardActivity.rangeTotalOne" : "cardActivity.rangeTotal").replace("{count}", String(query.data.meta.total_items))}</p>}
      </div>
      <div className={query.isPlaceholderData ? "opacity-60" : ""}>
        {query.isLoading ? <SkeletonRows rows={5} columns={4} /> : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon="activity" title={t("cardActivity.empty")}>{t("cards.noActivityHint")}</EmptyState>
        ) : (
          <ActivityList items={items} showCard={false} />
        )}
      </div>
      <TabPagination page={page} totalPages={query.data?.meta.total_pages ?? 1} totalItems={query.data?.meta.total_items} onPageChange={setPage} />
    </div>
  );
}

function CardJobsTab({ cardId }: { cardId: string }) {
  const { href, t } = useI18n();
  const [page, setPage] = useState(1);
  const query = useWalletSyncJobs({ cardId, page, pageSize: 15 });
  const items = query.data?.items ?? [];
  return (
    <div>
      {query.isLoading ? <SkeletonRows rows={4} columns={4} /> : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="sync" title={t("walletSync.empty")}>{t("cards.noJobsHint")}</EmptyState>
      ) : (
        <JobList items={items} showCard={false} />
      )}
      <TabPagination page={page} totalPages={query.data?.meta.total_pages ?? 1} totalItems={query.data?.meta.total_items} onPageChange={setPage} />
      <div className="border-t border-border px-4 py-3 text-right sm:px-5">
        <Link href={href(`/cards/wallet-sync?card_id=${cardId}`)} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">{t("cards.openInWalletSync")}<Icon name="arrowRight" className="size-4" /></Link>
      </div>
    </div>
  );
}

function CardIssuesTab({ cardId }: { cardId: string }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReconciliationIssue | null>(null);
  const query = useReconciliationIssues({ cardId, page, pageSize: 15 });
  const items = query.data?.items ?? [];
  return (
    <div>
      {query.isLoading ? <SkeletonRows rows={4} columns={4} /> : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="check" title={t("cards.noIssues")}>{t("cards.noIssuesHint")}</EmptyState>
      ) : (
        <IssueList items={items} onSelect={setSelected} showCard={false} />
      )}
      <TabPagination page={page} totalPages={query.data?.meta.total_pages ?? 1} totalItems={query.data?.meta.total_items} onPageChange={setPage} />
      <IssueModal issue={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function TabPagination(props: { page: number; totalPages: number; totalItems?: number; onPageChange: (page: number) => void }) {
  if (props.totalPages <= 1) return null;
  return <div className="border-t border-border px-4 py-3 sm:px-5"><Pagination {...props} /></div>;
}
