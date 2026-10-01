"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/dashboard/screen-kit";
import { CopyValue, OutcomeBadge, SchemeChip } from "@/components/cards/shared";
import { useI18n } from "@/lib/i18n/provider";
import { formatDateTime, formatMoney, formatRelative, reasonLabel } from "@/lib/cards/format";
import type { CardActivity } from "@/lib/cards/types";

const GRID_FULL = "md:grid-cols-[8.5rem_minmax(0,1.3fr)_minmax(0,1.2fr)_8.5rem_minmax(0,9.5rem)_1rem]";
const GRID_CARD = "md:grid-cols-[8.5rem_minmax(0,1.6fr)_8.5rem_minmax(0,10rem)_1rem]";

export function ActivityList({ items, showCard = true, onFilterCard }: { items: CardActivity[]; showCard?: boolean; onFilterCard?: (cardId: string) => void }) {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const grid = showCard ? GRID_FULL : GRID_CARD;

  return (
    <>
      <div className={`hidden gap-4 bg-subtle/70 px-6 py-3 text-xs font-semibold uppercase text-muted md:grid ${grid}`}>
        <span>{t("cardActivity.columnTime")}</span>
        <span>{t("cardActivity.columnMerchant")}</span>
        {showCard && <span>{t("cardActivity.columnCard")}</span>}
        <span className="text-right">{t("cardActivity.columnAmount")}</span>
        <span>{t("cardActivity.columnOutcome")}</span>
        <span />
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} grid={grid} showCard={showCard} open={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} onFilterCard={onFilterCard} />
        ))}
      </ul>
    </>
  );
}

function ActivityRow({ item, grid, showCard, open, onToggle, onFilterCard }: { item: CardActivity; grid: string; showCard: boolean; open: boolean; onToggle: () => void; onFilterCard?: (cardId: string) => void }) {
  const { href, t, locale } = useI18n();
  const panelId = `activity-${item.id}`;
  return (
    <li className={item.approved ? "" : "bg-danger-soft/25"}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3.5 text-left transition hover:bg-subtle/50 focus-visible:bg-subtle/50 focus-visible:outline-none sm:px-6 ${grid}`}
      >
        <time dateTime={item.created_at} title={formatDateTime(item.created_at, locale, "medium") ?? undefined} className="order-5 text-right text-xs text-muted md:order-none md:text-left md:text-sm">
          <span className="md:block">{formatRelative(item.created_at, locale)}</span>
          <span className="hidden text-xs md:block">{new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(item.created_at))}</span>
        </time>
        <div className="order-1 min-w-0 md:order-none">
          <p className="truncate font-mono text-sm font-medium">{item.merchant_name ?? t("cardActivity.unknownMerchant")}</p>
          <p className="truncate text-xs text-muted">
            {[item.merchant_category && `MCC ${item.merchant_category}`, item.channel && channelLabel(item.channel, t)].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        {showCard && (
          <div className="order-3 col-span-2 min-w-0 md:order-none md:col-span-1">
            <p className="flex min-w-0 items-center gap-2 text-sm">
              <SchemeChip scheme={item.scheme} className="shrink-0 text-xs text-muted" />
              <span className="truncate">{item.card_label ?? t("cardActivity.unknownCard")}</span>
            </p>
            <p className="truncate text-xs text-muted">{item.user_email ?? "—"}</p>
          </div>
        )}
        <p className={`order-2 text-right text-sm font-semibold tabular-nums md:order-none ${item.approved ? "" : "text-muted line-through decoration-muted/50"}`}>
          {formatMoney(item.amount, item.currency, locale)}
        </p>
        <div className="order-4 min-w-0 md:order-none">
          <OutcomeBadge approved={item.approved} reason={item.reason} />
        </div>
        <Icon name="chevronRight" className={`order-6 hidden size-4 text-muted transition-transform md:block ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div id={panelId} className="animate-fade-in border-t border-dashed border-border bg-subtle/40 px-4 py-4 sm:px-6">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Fact label={t("cardActivity.reason")}>
              <span>{reasonLabel(item.reason, t)}</span> <code className="ml-1 rounded bg-surface px-1 font-mono text-xs text-muted">{item.reason}</code>
            </Fact>
            <Fact label={t("cardActivity.responseCode")}><code className="font-mono">{item.response_code}</code></Fact>
            <Fact label={t("cardActivity.time")}>{formatDateTime(item.created_at, locale, "medium")}</Fact>
            <Fact label={t("cardActivity.attemptId")}><CopyValue value={item.id} display={item.id.slice(0, 8)} mono /></Fact>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.card_id && showCard && (
              <Link href={href(`/cards/${item.card_id}`)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition hover:bg-subtle">
                <Icon name="card" className="size-4" />{t("cardActivity.openCard")}
              </Link>
            )}
            {item.card_id && onFilterCard && (
              <button type="button" onClick={() => onFilterCard(item.card_id!)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition hover:bg-subtle">
                <Icon name="filter" className="size-4" />{t("cardActivity.onlyThisCard")}
              </button>
            )}
            {item.user_id && showCard && (
              <Link href={href(`/users/${item.user_id}`)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition hover:bg-subtle">
                <Icon name="user" className="size-4" />{t("cardActivity.openCustomer")}
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 min-w-0 font-medium">{children}</dd>
    </div>
  );
}

function channelLabel(channel: string, t: ReturnType<typeof useI18n>["t"]) {
  if (channel === "web") return t("cardActivity.channelWeb");
  if (channel === "pos") return t("cardActivity.channelPos");
  if (channel === "atm") return t("cardActivity.channelAtm");
  return channel;
}
