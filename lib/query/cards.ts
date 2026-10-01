"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiRequest } from "./api-client";
import type {
  AdminCard,
  CardActivity,
  CardScheme,
  CardSchemeRead,
  CardStats,
  CardStatus,
  Merchant,
  MerchantInput,
  MerchantPatch,
  ObservedMerchant,
  Paginated,
  ReconciliationIssue,
  ReconciliationKind,
  ReconciliationStatus,
  WalletComparison,
  WalletSyncJob,
  WalletSyncStatus,
} from "@/lib/cards/types";

const cardOps = createApiRequest("/api/card-ops");

export const cardOpsKey = ["card-ops"] as const;
const keys = {
  schemes: [...cardOpsKey, "schemes"] as const,
  cards: [...cardOpsKey, "cards"] as const,
  activity: [...cardOpsKey, "activity"] as const,
  stats: [...cardOpsKey, "stats"] as const,
  merchants: [...cardOpsKey, "merchants"] as const,
  observed: [...cardOpsKey, "observed"] as const,
  issues: [...cardOpsKey, "reconciliation"] as const,
  jobs: [...cardOpsKey, "wallet-sync"] as const,
  wallet: [...cardOpsKey, "wallet"] as const,
};

function query(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/* ---------- Schemes ---------- */

export function useCardSchemes() {
  return useQuery({ queryKey: keys.schemes, queryFn: () => cardOps<CardSchemeRead[]>("/card-schemes"), staleTime: 30000 });
}

export function useSchemeActions() {
  const client = useQueryClient();
  const patch = (scheme: CardSchemeRead) => {
    client.setQueryData<CardSchemeRead[]>(keys.schemes, (current) => current?.map((item) => (item.code === scheme.code ? scheme : item)));
    client.invalidateQueries({ queryKey: keys.stats });
    client.invalidateQueries({ queryKey: keys.cards });
  };
  const disable = useMutation({
    mutationFn: ({ code, reason, freezeExisting }: { code: CardScheme; reason?: string; freezeExisting: boolean }) =>
      cardOps<CardSchemeRead>(`/card-schemes/${code}/disable`, { method: "POST", body: JSON.stringify({ reason: reason || null, freeze_existing: freezeExisting }) }),
    onSuccess: patch,
  });
  const enable = useMutation({
    mutationFn: ({ code, unfreezeFrozenCards }: { code: CardScheme; unfreezeFrozenCards: boolean }) =>
      cardOps<CardSchemeRead>(`/card-schemes/${code}/enable`, { method: "POST", body: JSON.stringify({ unfreeze_frozen_cards: unfreezeFrozenCards }) }),
    onSuccess: patch,
  });
  return { disable, enable };
}

/* ---------- Cards ---------- */

export interface CardListParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  scheme?: CardScheme;
  status?: CardStatus;
  search?: string;
}

export function useAdminCards(params: CardListParams = {}) {
  return useQuery({
    queryKey: [...keys.cards, "list", params],
    queryFn: () =>
      cardOps<Paginated<AdminCard>>(
        `/admin/cards${query({ page: params.page ?? 1, page_size: params.pageSize ?? 20, user_id: params.userId, scheme: params.scheme, status: params.status, search: params.search })}`,
      ),
    placeholderData: keepPreviousData,
    staleTime: 15000,
  });
}

export function useAdminCard(id: string | undefined) {
  return useQuery({
    queryKey: [...keys.cards, "detail", id],
    queryFn: () => cardOps<AdminCard>(`/admin/cards/${id}`),
    enabled: Boolean(id),
    staleTime: 15000,
  });
}

export function useCardActions() {
  const client = useQueryClient();
  const patch = (card: AdminCard) => {
    client.setQueryData([...keys.cards, "detail", card.id], card);
    client.setQueriesData<Paginated<AdminCard>>({ queryKey: [...keys.cards, "list"] }, (current) =>
      current ? { ...current, items: current.items.map((item) => (item.id === card.id ? card : item)) } : current,
    );
    client.invalidateQueries({ queryKey: keys.stats });
  };
  const freeze = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cardOps<AdminCard>(`/admin/cards/${id}/freeze`, { method: "POST", body: JSON.stringify({ reason: reason || null }) }),
    onSuccess: patch,
  });
  const unfreeze = useMutation({
    mutationFn: (id: string) => cardOps<AdminCard>(`/admin/cards/${id}/unfreeze`, { method: "POST", body: "{}" }),
    onSuccess: patch,
  });
  return { freeze, unfreeze };
}

/* ---------- Activity & stats ---------- */

export interface ActivityParams {
  page?: number;
  pageSize?: number;
  cardId?: string;
  userId?: string;
  approved?: boolean;
  reason?: string;
  scheme?: CardScheme;
  startDate: string;
  endDate: string;
}

export function useCardActivity(params: ActivityParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...keys.activity, params],
    queryFn: () =>
      cardOps<Paginated<CardActivity>>(
        `/admin/card-activity${query({
          page: params.page ?? 1,
          page_size: params.pageSize ?? 20,
          card_id: params.cardId,
          user_id: params.userId,
          approved: params.approved,
          reason: params.reason,
          scheme: params.scheme,
          start_date: params.startDate,
          end_date: params.endDate,
        })}`,
      ),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
    staleTime: 15000,
  });
}

export function useCardStats() {
  return useQuery({ queryKey: keys.stats, queryFn: () => cardOps<CardStats>("/admin/card-stats"), staleTime: 30000, refetchInterval: 60000 });
}

/* ---------- Merchants ---------- */

export function useMerchants() {
  return useQuery({ queryKey: keys.merchants, queryFn: () => cardOps<Merchant[]>("/merchants"), staleTime: 30000 });
}

export interface ObservedParams {
  page?: number;
  pageSize?: number;
  days?: number;
  matched?: boolean;
  search?: string;
}

export function useObservedMerchants(params: ObservedParams = {}) {
  return useQuery({
    queryKey: [...keys.observed, params],
    queryFn: () =>
      cardOps<Paginated<ObservedMerchant>>(
        `/admin/merchants/observed${query({ page: params.page ?? 1, page_size: params.pageSize ?? 20, days: params.days ?? 30, matched: params.matched, search: params.search })}`,
      ),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}

export function useMerchantActions() {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: keys.merchants });
    client.invalidateQueries({ queryKey: keys.observed });
  };
  const create = useMutation({
    mutationFn: (input: MerchantInput) => cardOps<Merchant>("/merchants", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: MerchantPatch }) =>
      cardOps<Merchant>(`/merchants/${slug}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: invalidate,
  });
  return { create, update };
}

/* ---------- Reconciliation ---------- */

export interface IssueParams {
  page?: number;
  pageSize?: number;
  status?: ReconciliationStatus;
  kind?: ReconciliationKind;
  cardId?: string;
}

export function useReconciliationIssues(params: IssueParams = {}, options: { refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: [...keys.issues, params],
    queryFn: () =>
      cardOps<Paginated<ReconciliationIssue>>(
        `/admin/reconciliation/issues${query({ page: params.page ?? 1, page_size: params.pageSize ?? 20, status: params.status, kind: params.kind, card_id: params.cardId })}`,
      ),
    placeholderData: keepPreviousData,
    refetchInterval: options.refetchInterval,
    staleTime: 15000,
  });
}

export function useReconciliationActions() {
  const client = useQueryClient();
  const run = useMutation({
    mutationFn: (range: { from: string; to: string }) =>
      cardOps<null>("/admin/reconciliation/run", { method: "POST", body: JSON.stringify({ from_date: range.from, to_date: range.to }) }),
  });
  const resolve = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      cardOps<ReconciliationIssue>(`/admin/reconciliation/issues/${id}/resolve`, { method: "POST", body: JSON.stringify({ note }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.issues }),
  });
  return { run, resolve };
}

/* ---------- Wallet sync ---------- */

export interface JobParams {
  page?: number;
  pageSize?: number;
  status?: WalletSyncStatus;
  cardId?: string;
}

export function useWalletSyncJobs(params: JobParams = {}, options: { refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: [...keys.jobs, params],
    queryFn: () =>
      cardOps<Paginated<WalletSyncJob>>(`/admin/wallet-sync/jobs${query({ page: params.page ?? 1, page_size: params.pageSize ?? 20, status: params.status, card_id: params.cardId })}`),
    placeholderData: keepPreviousData,
    refetchInterval: options.refetchInterval,
    staleTime: 15000,
  });
}

export function useWalletSyncRun() {
  return useMutation({ mutationFn: () => cardOps<null>("/admin/wallet-sync/run", { method: "POST", body: "{}" }) });
}

/** Reads the live wallet from the issuer, so it only runs when the admin asks for it. */
export function useWalletComparison(cardId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...keys.wallet, cardId],
    queryFn: () => cardOps<WalletComparison>(`/admin/wallet-sync/cards/${cardId}`),
    enabled: Boolean(cardId) && enabled,
    staleTime: 0,
    gcTime: 60000,
    retry: false,
  });
}

/** Lightweight counters: a one-row page is enough to read `meta.total_items`. */
export function useIssueCount(params: Omit<IssueParams, "page" | "pageSize">, options: { refetchInterval?: number | false } = {}) {
  const result = useReconciliationIssues({ ...params, page: 1, pageSize: 1 }, options);
  return { ...result, count: result.data?.meta.total_items };
}

export function useJobCount(params: Omit<JobParams, "page" | "pageSize">, options: { refetchInterval?: number | false } = {}) {
  const result = useWalletSyncJobs({ ...params, page: 1, pageSize: 1 }, options);
  return { ...result, count: result.data?.meta.total_items };
}
