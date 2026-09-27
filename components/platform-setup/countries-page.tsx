"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Modal, ModalActions } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";
import { useCountries, useCountryActions } from "@/lib/query/countries";
import { CountryModal } from "@/components/platform-setup/country-modal";
import type { Country } from "@/lib/countries/types";

export function CountriesPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { remove, update } = useCountryActions();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const query = useCountries({ page, pageSize: 20 });
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
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
      <PageHeader title={t("platformSetup.title")} description={t("platformSetup.description")} />

      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>{t("platformSetup.newCountry")}</Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {query.isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse bg-subtle/50" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted">{query.error.message}</p>
            <Button className="mt-4" variant="secondary" onClick={() => query.refetch()}>{t("common.tryAgain")}</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium">{t("platformSetup.noResults")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium sm:px-6">{t("platformSetup.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("platformSetup.iso2")}</th>
                  <th className="px-4 py-3 font-medium">{t("platformSetup.phoneCode")}</th>
                  <th className="px-4 py-3 font-medium">{t("platformSetup.currencyCode")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                  <th className="px-4 py-3 font-medium sm:px-6 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((country) => (
                  <tr key={country.id} className="transition hover:bg-subtle/60">
                    <td className="px-4 py-3 sm:px-6">
                      <span className="font-medium">{country.flag_emoji} {country.name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{country.iso2_code}</td>
                    <td className="px-4 py-3 text-muted">{country.phone_code}</td>
                    <td className="px-4 py-3 text-muted">{country.currency_symbol} {country.currency_code}</td>
                    <td className="px-4 py-3">
                      <Badge tone={country.is_active ? "success" : "neutral"}>{country.is_active ? t("platformSetup.active") : t("platformSetup.inactive")}</Badge>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => { setEditing(country); setModalOpen(true); }}>{t("common.edit")}</Button>
                        <Button variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setDeleteTarget(country)}>{t("common.delete")}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
