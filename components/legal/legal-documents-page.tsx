"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useI18n } from "@/lib/i18n/provider";
import { useLegalDocuments } from "@/lib/query/legal-documents";
import { LegalStatusBadge } from "@/components/legal/legal-status-badge";
import type { LegalDocument } from "@/lib/legal/types";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function LegalDocumentsPage() {
  const { href, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const documentType = searchParams.get("document_type") ?? "";
  const status = searchParams.get("status") ?? "";

  const query = useLegalDocuments({ page, pageSize: 20, documentType: documentType || undefined, status: status || undefined });
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const totalPages = query.data?.meta.total_pages ?? 1;

  const setParams = (updates: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("legalDocuments.title")} description={t("legalDocuments.description")} />

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="w-full sm:w-56">
            <Select label={t("legalDocuments.filterByType")} value={documentType} onChange={(e) => setParams({ document_type: e.target.value || null, page: 1 })}>
              <option value="">{t("legalDocuments.allTypes")}</option>
              <option value="terms_and_conditions">{t("legalDocuments.termsAndConditions")}</option>
              <option value="privacy_policy">{t("legalDocuments.privacyPolicy")}</option>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select label={t("legalDocuments.filterByStatus")} value={status} onChange={(e) => setParams({ status: e.target.value || null, page: 1 })}>
              <option value="">{t("legalDocuments.allStatuses")}</option>
              <option value="draft">{t("legalDocuments.statusDraft")}</option>
              <option value="published">{t("legalDocuments.statusPublished")}</option>
              <option value="archived">{t("legalDocuments.statusArchived")}</option>
            </Select>
          </div>
        </div>
        <Link href={href("/legal-documents/new")}>
          <Button>{t("legalDocuments.newDraft")}</Button>
        </Link>
      </section>

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
            <p className="text-sm font-medium">{t("legalDocuments.noResults")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium sm:px-6">{t("legalDocuments.documentType")}</th>
                  <th className="px-4 py-3 font-medium">{t("legalDocuments.version")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("legalDocuments.effectiveDate")}</th>
                  <th className="px-4 py-3 font-medium sm:px-6">{t("legalDocuments.publishedAt")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((doc: LegalDocument) => (
                  <tr key={doc.id} className="transition hover:bg-subtle/60">
                    <td className="px-4 py-3 sm:px-6">
                      <Link href={href(`/legal-documents/${doc.id}`)} className="font-medium hover:underline">
                        {doc.document_type === "terms_and_conditions" ? t("legalDocuments.termsAndConditions") : t("legalDocuments.privacyPolicy")}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{doc.version}</td>
                    <td className="px-4 py-3"><LegalStatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3 text-muted">{formatDate(doc.effective_date)}</td>
                    <td className="px-4 py-3 text-muted sm:px-6">{formatDate(doc.published_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />
    </div>
  );
}
