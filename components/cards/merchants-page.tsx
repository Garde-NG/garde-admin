"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfigPageHeader, EmptyState, ErrorState, Icon, IconButton, SearchInput, SkeletonRows } from "@/components/dashboard/screen-kit";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Modal, ModalActions } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { MerchantModal, type MerchantDraft } from "@/components/cards/merchant-modal";
import { useI18n } from "@/lib/i18n/provider";
import { useMerchantActions, useMerchants, useObservedMerchants } from "@/lib/query/cards";
import { SLUG_PATTERN, formatMoney, formatNumber, formatRelative, slugify, titleCase } from "@/lib/cards/format";
import { useUrlParams } from "@/lib/use-url-params";
import type { Merchant, ObservedMerchant } from "@/lib/cards/types";

type Tab = "catalog" | "discover";

export function MerchantsPage() {
  const { t } = useI18n();
  const { get, setParams } = useUrlParams();
  const tab = (get("tab") || "catalog") as Tab;
  const merchants = useMerchants();
  const uncovered = useObservedMerchants({ page: 1, pageSize: 1, matched: false, days: 30 });
  const [createDraft, setCreateDraft] = useState<MerchantDraft | null>(null);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const categories = useMemo(() => Array.from(new Set((merchants.data ?? []).map((merchant) => merchant.category))).sort(), [merchants.data]);
  const uncoveredCount = uncovered.data?.meta.total_items;

  const openCreate = (draft: MerchantDraft | null) => {
    setEditing(null);
    setCreateDraft(draft);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5">
      <ConfigPageHeader
        icon="store"
        showBackLink={false}
        title={t("merchants.title")}
        description={t("merchants.description")}
        actions={
          <>
            <Button variant="secondary" onClick={() => setReactivateOpen(true)}><Icon name="refresh" className="size-4" />{t("merchants.reactivate")}</Button>
            <Button onClick={() => openCreate(null)}><Icon name="plus" className="size-4" />{t("merchants.add")}</Button>
          </>
        }
      />

      <Tabs
        label={t("merchants.title")}
        value={tab}
        onChange={(value) => setParams({ tab: value === "catalog" ? null : value, page: null, q: null })}
        items={[
          { value: "catalog", label: t("merchants.tabCatalog"), badge: merchants.data ? <Badge>{merchants.data.length}</Badge> : undefined },
          { value: "discover", label: t("merchants.tabDiscover"), badge: uncoveredCount ? <Badge tone="warning">{uncoveredCount}</Badge> : undefined },
        ]}
      />

      {tab === "catalog" ? (
        <CatalogTab query={merchants} categories={categories} onEdit={(merchant) => { setEditing(merchant); setCreateDraft(null); setModalOpen(true); }} onCreate={() => openCreate(null)} onDiscover={() => setParams({ tab: "discover" })} uncoveredCount={uncoveredCount} />
      ) : (
        <DiscoverTab onAdd={(item) => openCreate(draftFrom(item))} />
      )}

      <MerchantModal open={modalOpen} onClose={() => setModalOpen(false)} merchant={editing} draft={createDraft} categories={categories} />
      <ReactivateModal open={reactivateOpen} onClose={() => setReactivateOpen(false)} />
    </div>
  );
}

function draftFrom(item: ObservedMerchant): MerchantDraft {
  const pattern = (item.suggested_pattern ?? item.merchant_name).toUpperCase();
  return {
    name: titleCase(item.merchant_name).slice(0, 80),
    slug: item.suggested_slug ?? slugify(item.merchant_name),
    category: "",
    patterns: [pattern],
    mccCodes: [],
    suggestedMcc: item.merchant_category,
    source: item.merchant_name,
  };
}

/* ---------- Catalog ---------- */

function CatalogTab({ query, categories, onEdit, onCreate, onDiscover, uncoveredCount }: { query: ReturnType<typeof useMerchants>; categories: string[]; onEdit: (merchant: Merchant) => void; onCreate: () => void; onDiscover: () => void; uncoveredCount?: number }) {
  const { t } = useI18n();
  const { get, setParams } = useUrlParams();
  const search = get("q");
  const category = get("category");
  const [deactivating, setDeactivating] = useState<Merchant | null>(null);
  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (query.data ?? [])
      .filter((merchant) => !category || merchant.category === category)
      .filter((merchant) => !needle || merchant.name.toLowerCase().includes(needle) || merchant.slug.includes(needle) || merchant.mcc_codes.some((code) => code.includes(needle)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query.data, search, category]);

  return (
    <>
      {uncoveredCount ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning-soft/60 p-4 sm:flex-row sm:items-center">
          <Icon name="info" className="size-5 shrink-0 text-warning" />
          <p className="min-w-0 flex-1 text-sm">{t(uncoveredCount === 1 ? "merchants.uncoveredNoticeOne" : "merchants.uncoveredNotice").replace("{count}", String(uncoveredCount))}</p>
          <Button variant="secondary" onClick={onDiscover}>{t("merchants.review")}<Icon name="arrowRight" className="size-4" /></Button>
        </div>
      ) : null}

      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card sm:grid-cols-[minmax(0,1fr)_14rem]">
        <SearchInput label={t("common.search")} placeholder={t("merchants.searchCatalog")} value={search} onChange={(value) => setParams({ q: value || null })} />
        <Select label={t("merchants.category")} hideLabel value={category} onChange={(event) => setParams({ category: event.target.value || null })}>
          <option value="">{t("merchants.allCategories")}</option>
          {categories.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
        </Select>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {query.isLoading ? (
          <SkeletonRows rows={6} columns={4} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          search || category ? (
            <EmptyState icon="store" title={t("merchants.noMatch")}>{t("common.tryAnotherSearch")}</EmptyState>
          ) : (
            <EmptyState icon="store" title={t("merchants.empty")} action={<Button onClick={onCreate}><Icon name="plus" className="size-4" />{t("merchants.add")}</Button>}>{t("merchants.emptyHint")}</EmptyState>
          )
        ) : (
          <>
            <div className="hidden gap-4 bg-subtle/70 px-6 py-3 text-xs font-semibold uppercase text-muted md:grid md:grid-cols-[minmax(0,1.4fr)_9rem_minmax(0,1fr)_5.5rem]">
              <span>{t("merchants.name")}</span>
              <span>{t("merchants.category")}</span>
              <span>{t("merchants.mccCodes")}</span>
              <span className="sr-only">{t("common.actions")}</span>
            </div>
            <ul className="divide-y divide-border">
              {items.map((merchant) => (
                <li key={merchant.slug} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_9rem_minmax(0,1fr)_5.5rem]">
                  <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-sm font-semibold text-brand">{merchant.name.charAt(0).toUpperCase()}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{merchant.name}</p>
                      <p className="truncate font-mono text-xs text-muted">{merchant.slug}</p>
                    </div>
                  </div>
                  <div className="order-3 md:order-none"><Badge className="capitalize">{merchant.category}</Badge></div>
                  <div className="order-4 col-span-2 flex flex-wrap gap-1 md:order-none md:col-span-1">
                    {merchant.mcc_codes.length === 0 ? (
                      <span className="text-xs text-muted">{t("merchants.anyMcc")}</span>
                    ) : (
                      merchant.mcc_codes.map((code) => <code key={code} className="rounded bg-subtle px-1.5 py-0.5 font-mono text-xs">{code}</code>)
                    )}
                  </div>
                  <div className="order-2 flex justify-end gap-0.5 md:order-none">
                    <IconButton label={t("common.edit")} icon="pencil" onClick={() => onEdit(merchant)} />
                    <IconButton label={t("merchants.deactivate")} icon="ban" tone="danger" onClick={() => setDeactivating(merchant)} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <DeactivateModal merchant={deactivating} onClose={() => setDeactivating(null)} />
    </>
  );
}

function DeactivateModal({ merchant, onClose }: { merchant: Merchant | null; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { update } = useMerchantActions();
  return (
    <Modal open={Boolean(merchant)} onClose={() => !update.isPending && onClose()} title={t("merchants.deactivateTitle").replace("{name}", merchant?.name ?? "")}>
      <p className="text-sm text-muted">{t("merchants.deactivateBody")}</p>
      <Alert tone="warning">{t("merchants.deactivateWarning")}</Alert>
      {merchant && <p className="text-xs text-muted">{t("merchants.deactivateSlugNote")} <code className="rounded bg-subtle px-1 font-mono text-foreground">{merchant.slug}</code></p>}
      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={update.isPending}>{t("common.cancel")}</Button>
        <Button
          variant="danger"
          loading={update.isPending}
          onClick={() =>
            merchant &&
            update.mutate(
              { slug: merchant.slug, input: { is_active: false } },
              { onSuccess: () => { toast.success(t("merchants.deactivateSuccess").replace("{name}", merchant.name)); onClose(); }, onError: (error) => toast.error(error.message) },
            )
          }
        >
          {t("merchants.deactivate")}
        </Button>
      </ModalActions>
    </Modal>
  );
}

function ReactivateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { update } = useMerchantActions();
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = SLUG_PATTERN.test(slug);
  const close = () => {
    if (update.isPending) return;
    setSlug("");
    setTouched(false);
    onClose();
  };
  return (
    <Modal open={open} onClose={close} title={t("merchants.reactivateTitle")}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (!valid) return;
          update.mutate(
            { slug, input: { is_active: true } },
            { onSuccess: (merchant) => { toast.success(t("merchants.reactivateSuccess").replace("{name}", merchant.name)); close(); }, onError: (error) => toast.error(error.message) },
          );
        }}
      >
        <p className="text-sm text-muted">{t("merchants.reactivateBody")}</p>
        <Field label={t("merchants.slug")} className="font-mono" placeholder="netflix" value={slug} onChange={(event) => setSlug(event.target.value.trim().toLowerCase())} error={touched && !valid ? t("merchants.errorSlug") : undefined} autoFocus />
        <ModalActions>
          <Button variant="secondary" onClick={close} disabled={update.isPending}>{t("common.cancel")}</Button>
          <Button type="submit" loading={update.isPending}>{t("merchants.reactivate")}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

/* ---------- Discover ---------- */

type Matched = "unmatched" | "matched" | "all";

function DiscoverTab({ onAdd }: { onAdd: (item: ObservedMerchant) => void }) {
  const { t, locale } = useI18n();
  const { get, setParams, page } = useUrlParams();
  const days = Number(get("days")) || 30;
  const matched = (get("matched") || "unmatched") as Matched;
  const search = get("q");
  const [draft, setDraft] = useState(search);

  useEffect(() => {
    if (draft.trim() === search) return;
    const timer = window.setTimeout(() => setParams({ q: draft.trim() || null, page: null }), 350);
    return () => window.clearTimeout(timer);
  }, [draft, search, setParams]);

  const query = useObservedMerchants({ page, pageSize: 20, days, matched: matched === "all" ? undefined : matched === "matched", search: search || undefined });
  const items = query.data?.items ?? [];

  return (
    <>
      <p className="max-w-3xl text-sm text-muted">{t("merchants.discoverIntro")}</p>
      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)_10rem]">
        <SearchInput label={t("common.search")} placeholder={t("merchants.searchObserved")} value={draft} onChange={setDraft} />
        <Segmented
          label={t("merchants.coverage")}
          value={matched}
          onChange={(value) => setParams({ matched: value === "unmatched" ? null : value, page: null })}
          options={[
            { value: "unmatched", label: t("merchants.notInCatalog") },
            { value: "matched", label: t("merchants.inCatalog") },
            { value: "all", label: t("cards.all") },
          ]}
        />
        <Select label={t("merchants.window")} hideLabel value={String(days)} onChange={(event) => setParams({ days: event.target.value === "30" ? null : event.target.value, page: null })}>
          {[7, 30, 90, 365].map((value) => <option key={value} value={String(value)}>{t("merchants.lastDays").replace("{days}", String(value))}</option>)}
        </Select>
      </section>

      <section className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
        {query.isLoading ? (
          <SkeletonRows rows={6} columns={5} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          matched === "unmatched" && !search ? (
            <EmptyState icon="check" title={t("merchants.allCovered")}>{t("merchants.allCoveredHint")}</EmptyState>
          ) : (
            <EmptyState icon="store" title={t("merchants.noObserved")}>{t("common.tryAnotherSearch")}</EmptyState>
          )
        ) : (
          <>
            <div className="hidden gap-4 bg-subtle/70 px-6 py-3 text-xs font-semibold uppercase text-muted lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6rem_minmax(0,8rem)_7rem_9.5rem]">
              <span>{t("merchants.statementName")}</span>
              <span>{t("merchants.attempts")}</span>
              <span className="text-right">{t("merchants.cards")}</span>
              <span className="text-right">{t("merchants.approvedVolume")}</span>
              <span>{t("merchants.lastSeen")}</span>
              <span className="text-right">{t("merchants.coverage")}</span>
            </div>
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const approvedShare = item.attempts ? (item.approved / item.attempts) * 100 : 0;
                const volume = Object.entries(item.approved_volume ?? {});
                return (
                  <li key={`${item.merchant_name}-${item.merchant_category}`} className="grid items-center gap-x-4 gap-y-2.5 px-4 py-3.5 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6rem_minmax(0,8rem)_7rem_9.5rem]">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-medium" title={item.merchant_name}>{item.merchant_name}</p>
                      <p className="text-xs text-muted">{item.merchant_category ? `MCC ${item.merchant_category}` : t("merchants.noMcc")}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="text-sm font-medium tabular-nums">{formatNumber(item.attempts, locale)}</span>
                        <span className="text-muted">
                          <span className="text-success">{formatNumber(item.approved, locale)} ✓</span> · <span className="text-danger">{formatNumber(item.declined, locale)} ✕</span>
                        </span>
                      </div>
                      <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
                        {item.approved > 0 && <span className="h-full rounded-full bg-success" style={{ width: `${approvedShare}%` }} />}
                        {item.declined > 0 && <span className="h-full flex-1 rounded-full bg-danger/70" />}
                      </div>
                    </div>
                    <p className="text-sm tabular-nums text-muted lg:text-right"><span className="lg:hidden">{t("merchants.cards")}: </span>{formatNumber(item.distinct_cards, locale)}</p>
                    <div className="text-sm tabular-nums lg:text-right">
                      {volume.length === 0 ? <span className="text-muted">—</span> : volume.map(([currency, amount]) => <p key={currency}>{formatMoney(amount, currency, locale, { compact: amount >= 10000000 })}</p>)}
                    </div>
                    <p className="text-xs text-muted" title={item.last_seen}>{formatRelative(item.last_seen, locale)}</p>
                    <div className="lg:text-right">
                      {item.matched_merchant ? (
                        <Badge tone="brand" className="gap-1 font-mono"><Icon name="check" className="size-3" />{item.matched_merchant}</Badge>
                      ) : (
                        <Button variant="secondary" className="w-full lg:w-auto" onClick={() => onAdd(item)}><Icon name="plus" className="size-4" />{t("merchants.addToCatalog")}</Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <Pagination page={page} totalPages={query.data?.meta.total_pages ?? 1} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />
    </>
  );
}
