"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConfigPageHeader, EmptyState, ErrorState, IconButton, SearchInput, SkeletonRows } from "@/components/dashboard/screen-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import { useCountries, useCountryActions } from "@/lib/query/countries";
import { CountryModal } from "@/components/platform-setup/country-modal";
import type { Country } from "@/lib/countries/types";

const ROW_GRID = "md:grid-cols-[minmax(0,1.5fr)_6rem_7rem_minmax(0,1fr)_5.5rem_5.5rem]";

function flagUrl(country: Country) {
  return `https://flagcdn.com/w40/${country.iso2_code.toLowerCase()}.png`;
}

export function CountriesPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { remove, update } = useCountryActions();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const search = searchParams.get("q") ?? "";
  const [searchDraft, setSearchDraft] = useState(search);
  const query = useCountries({ page, pageSize: 20 });
  const items = useMemo(() => {
    const value = search.trim().toLowerCase();
    const all = query.data?.items ?? [];
    if (!value) return all;
    return all.filter((country) =>
      [country.name, country.iso2_code, country.iso3_code, country.phone_code, country.currency_code, country.currency_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [query.data?.items, search]);
  const totalPages = query.data?.meta.total_pages ?? 1;

  const [editing, setEditing] = useState<Country | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);

  const setParams = (updates: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  const onError = (error: unknown) => toast.error(error instanceof Error ? error.message : t("api.genericFailure"));

  return (
    <div className="space-y-5">
      <ConfigPageHeader
        icon="globe"
        title="Countries"
        description={t("platformSetup.description")}
        actions={<Button onClick={() => { setEditing(null); setModalOpen(true); }}>{t("platformSetup.newCountry")}</Button>}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <form
          className="border-b border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setParams({ q: searchDraft, page: 1 });
          }}
        >
          <SearchInput value={searchDraft} onChange={setSearchDraft} placeholder="Search name, ISO code, dialing code or currency" label="Search countries" />
        </form>
        {query.isLoading ? (
          <SkeletonRows rows={7} columns={5} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="globe"
            title={search ? "No countries match your search" : t("platformSetup.noResults")}
            action={search ? <Button variant="secondary" onClick={() => { setSearchDraft(""); setParams({ q: null, page: 1 }); }}>Clear search</Button> : undefined}
          >
            {search ? "Try a different name, code or currency." : "Countries you add will appear here."}
          </EmptyState>
        ) : (
          <>
            <div className={`hidden gap-4 bg-subtle/70 px-6 py-3 text-xs font-semibold uppercase text-muted md:grid ${ROW_GRID}`}>
              <span>{t("platformSetup.name")}</span>
              <span>{t("platformSetup.iso2")}</span>
              <span>{t("platformSetup.phoneCode")}</span>
              <span>{t("platformSetup.currencyCode")}</span>
              <span>{t("common.status")}</span>
              <span className="text-right">{t("common.actions")}</span>
            </div>
            <ul className="divide-y divide-border">
                {items.map((country) => (
                  <li key={country.id} className={`grid items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6 ${ROW_GRID} ${country.is_active ? "" : "bg-subtle/30"}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 min-w-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft px-2 ring-1 ring-brand/10">
                        <span
                          aria-hidden
                          style={{ backgroundImage: `url(${flagUrl(country)})` }}
                          className="h-5 w-7 rounded-sm bg-cover bg-center shadow-sm"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{country.name}</p>
                        <p className="text-xs text-muted md:hidden">{country.iso2_code} · {country.phone_code}</p>
                      </div>
                    </div>
                    <p className="font-mono text-sm text-muted md:text-foreground">{country.iso2_code}</p>
                    <p className="text-sm text-muted md:text-foreground">{country.phone_code}</p>
                    <p className="text-sm">
                      {country.currency_name} <span className="font-mono text-muted">({country.currency_symbol} {country.currency_code})</span>
                    </p>
                    <div>
                      <Badge tone={country.is_active ? "success" : "neutral"}>{country.is_active ? t("platformSetup.active") : t("platformSetup.inactive")}</Badge>
                    </div>
                    <div className="-mx-1.5 flex justify-end gap-0.5 md:mx-0">
                      <IconButton label={`${t("common.edit")} ${country.name}`} icon="pencil" onClick={() => { setEditing(country); setModalOpen(true); }} />
                      <IconButton label={`${t("common.delete")} ${country.name}`} icon="trash" tone="danger" onClick={() => setDeleteTarget(country)} />
                    </div>
                  </li>
                ))}
            </ul>
          </>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />

      <CountryModal open={modalOpen} onClose={() => setModalOpen(false)} country={editing} />

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={t("platformSetup.deleteConfirmTitle")}>
        <p className="text-sm text-muted">{t("platformSetup.deleteConfirmBody")}</p>
        <ModalActions>
          {deleteTarget?.is_active && (
            <Button
              variant="secondary"
              onClick={() =>
                update.mutate(
                  { id: deleteTarget.id, input: { is_active: false } },
                  { onSuccess: () => { toast.success(t("platformSetup.updateSuccess")); setDeleteTarget(null); }, onError },
                )
              }
            >
              {t("platformSetup.markInactiveInstead")}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={remove.isPending}>{t("common.cancel")}</Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              deleteTarget &&
              remove.mutate(deleteTarget.id, {
                onSuccess: () => { toast.success(t("platformSetup.deleteSuccess")); setDeleteTarget(null); },
                onError,
              })
            }
          >
            {t("common.delete")}
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
