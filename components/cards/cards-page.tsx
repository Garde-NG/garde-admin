"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfigPageHeader, EmptyState, ErrorState, Icon, SearchInput, SkeletonRows } from "@/components/dashboard/screen-kit";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { CardFace, CardStatusBadge, FilterChip, Money, SchemeChip } from "@/components/cards/shared";
import { useI18n } from "@/lib/i18n/provider";
import { useAdminCards } from "@/lib/query/cards";
import { useAdminUser } from "@/lib/query/users";
import { SCHEMES, formatDate, schemeName } from "@/lib/cards/format";
import { useUrlParams } from "@/lib/use-url-params";
import type { CardScheme, CardStatus } from "@/lib/cards/types";

const ROW_GRID = "md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_7rem_8.5rem_9rem_7rem]";

export function CardsPage() {
  const { href, t, locale } = useI18n();
  const { get, setParams, page } = useUrlParams();
  const search = get("search");
  const scheme = get("scheme") as CardScheme | "";
  const status = (get("status") || "all") as CardStatus | "all";
  const userId = get("user_id");
  const [draft, setDraft] = useState(search);

  // Search as the admin types, without a request per keystroke.
  useEffect(() => {
    if (draft.trim() === search) return;
    const timer = window.setTimeout(() => setParams({ search: draft.trim() || null, page: null }), 350);
    return () => window.clearTimeout(timer);
  }, [draft, search, setParams]);

  const owner = useAdminUser(userId || undefined);
  const query = useAdminCards({ page, pageSize: 20, search: search || undefined, scheme: scheme || undefined, status: status === "all" ? undefined : status, userId: userId || undefined });
  const items = query.data?.items ?? [];
  const filtered = Boolean(search || scheme || status !== "all" || userId);
  const ownerName = owner.data ? [owner.data.first_name, owner.data.last_name].filter(Boolean).join(" ") || owner.data.email : t("common.loading");

  return (
    <div className="space-y-5">
      <ConfigPageHeader icon="card" showBackLink={false} title={t("cards.title")} description={t("cards.description")} />

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setParams({ search: draft.trim() || null, page: null });
          }}
        >
          <SearchInput label={t("common.search")} placeholder={t("cards.searchPlaceholder")} value={draft} onChange={setDraft} />
          <Select label={t("cards.scheme")} hideLabel value={scheme} onChange={(event) => setParams({ scheme: event.target.value || null, page: null })}>
            <option value="">{t("cards.allSchemes")}</option>
            {SCHEMES.map((code) => (
              <option key={code} value={code}>{schemeName(code)}</option>
            ))}
          </Select>
          <Segmented
            label={t("common.status")}
            value={status}
            onChange={(value) => setParams({ status: value === "all" ? null : value, page: null })}
            options={[
              { value: "all", label: t("cards.all") },
              { value: "active", label: t("cards.statusActive") },
              { value: "frozen", label: t("cards.statusFrozen") },
              { value: "terminated", label: t("cards.statusTerminated") },
            ]}
          />
        </form>
        {(userId || filtered) && (
          <div className="flex flex-wrap items-center gap-2">
            {userId && <FilterChip label={t("cards.owner")} value={ownerName} onClear={() => setParams({ user_id: null, page: null })} />}
            {filtered && (
              <button type="button" onClick={() => { setDraft(""); setParams({ search: null, scheme: null, status: null, user_id: null, page: null }); }} className="h-8 rounded-full px-3 text-xs font-medium text-muted transition hover:bg-subtle hover:text-foreground">
                {t("cards.clearAll")}
              </button>
            )}
          </div>
        )}
      </section>

      <section className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`} aria-busy={query.isFetching || undefined}>
        {query.isLoading ? (
          <SkeletonRows rows={6} columns={6} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon="card" title={filtered ? t("cards.noMatch") : t("cards.empty")}>
            {filtered ? t("common.tryAnotherSearch") : t("cards.emptyHint")}
          </EmptyState>
        ) : (
          <>
            <div className={`hidden gap-4 bg-subtle/70 px-6 py-3 text-xs font-semibold uppercase text-muted md:grid ${ROW_GRID}`}>
              <span>{t("cards.columnCard")}</span>
              <span>{t("cards.owner")}</span>
              <span>{t("cards.scheme")}</span>
              <span className="text-right">{t("cards.balance")}</span>
              <span>{t("common.status")}</span>
              <span>{t("cards.issued")}</span>
            </div>
            <ul className="divide-y divide-border">
              {items.map((card) => (
                <li key={card.id}>
                  <Link href={href(`/cards/${card.id}`)} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 transition hover:bg-subtle/50 focus-visible:bg-subtle/50 focus-visible:outline-none sm:px-6 ${ROW_GRID}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <CardFace card={card} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{card.label}</p>
                        <p className="font-mono text-xs text-muted">•••• {card.last4 ?? "····"}</p>
                      </div>
                    </div>
                    <div className="col-start-2 row-start-1 text-right md:hidden">
                      <Money amount={card.balance} currency={card.currency} className="text-sm font-semibold" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm">{card.user_name || card.user_email}</p>
                      <p className="truncate text-xs text-muted">{card.user_email}</p>
                    </div>
                    <div className="hidden md:block"><SchemeChip scheme={card.scheme} /></div>
                    <div className="hidden text-right md:block"><Money amount={card.balance} currency={card.currency} className="text-sm font-medium" /></div>
                    <div className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1">
                      <CardStatusBadge status={card.status} freezeSource={card.freeze_source} />
                      <span className="md:hidden"><SchemeChip scheme={card.scheme} className="text-xs text-muted" /></span>
                    </div>
                    <div className="hidden items-center justify-between gap-2 md:flex">
                      <time dateTime={card.created_at} className="text-sm text-muted">{formatDate(card.created_at, locale)}</time>
                      <Icon name="chevronRight" className="size-4 text-muted" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <Pagination page={page} totalPages={query.data?.meta.total_pages ?? 1} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />
    </div>
  );
}
