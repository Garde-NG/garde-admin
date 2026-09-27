"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConfigPageHeader, EmptyState, ErrorState, Icon, SkeletonRows } from "@/components/dashboard/screen-kit";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useI18n } from "@/lib/i18n/provider";
import { useLegalDocuments } from "@/lib/query/legal-documents";
import { LegalStatusBadge } from "@/components/legal/legal-status-badge";
import type { LegalDocument } from "@/lib/legal/types";

const ROW_GRID = "md:grid-cols-[minmax(0,1.4fr)_6rem_7rem_8rem_8rem]";

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
      <ConfigPageHeader
        icon="clipboard"
        showBackLink={false}
        title={t("legalDocuments.title")}
        description={t("legalDocuments.description")}
        actions={<Link href={href("/legal-documents/new")}><Button><Icon name="pencil" className="size-4" />{t("legalDocuments.newDraft")}</Button></Link>}
      />

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,16rem)_minmax(0,14rem)_auto] lg:items-end">
          <Select label={t("legalDocuments.filterByType")} value={documentType} onChange={(e) => setParams({ document_type: e.target.value || null, page: 1 })}>
              <option value="">{t("legalDocuments.allTypes")}</option>
              <option value="terms_and_conditions">{t("legalDocuments.termsAndConditions")}</option>
              <option value="privacy_policy">{t("legalDocuments.privacyPolicy")}</option>
          </Select>
          <Select label={t("legalDocuments.filterByStatus")} value={status} onChange={(e) => setParams({ status: e.target.value || null, page: 1 })}>
              <option value="">{t("legalDocuments.allStatuses")}</option>
              <option value="draft">{t("legalDocuments.statusDraft")}</option>
              <option value="published">{t("legalDocuments.statusPublished")}</option>
              <option value="archived">{t("legalDocuments.statusArchived")}</option>
          </Select>
          <Button className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto" variant="secondary" onClick={() => setParams({ document_type: null, status: null, page: 1 })}>
            Reset filters
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {query.isLoading ? (
          <SkeletonRows rows={6} columns={5} />
        ) : query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon="clipboard" title={t("legalDocuments.noResults")}>
            Create a draft or adjust your filters.
          </EmptyState>
        ) : (
          <>
            <div className={`hidden gap-4 bg-subtle/70 px-6 py-3 text-xs font-semibold uppercase text-muted md:grid ${ROW_GRID}`}>
              <span>{t("legalDocuments.documentType")}</span>
              <span>{t("legalDocuments.version")}</span>
              <span>{t("common.status")}</span>
              <span>{t("legalDocuments.effectiveDate")}</span>
              <span>{t("legalDocuments.publishedAt")}</span>
            </div>
            <ul className="divide-y divide-border">
                {items.map((doc: LegalDocument) => (
                  <li key={doc.id}>
                    <Link href={href(`/legal-documents/${doc.id}`)} className={`grid items-center gap-x-4 gap-y-2 px-4 py-4 transition hover:bg-subtle/50 focus-visible:bg-subtle/50 focus-visible:outline-none sm:px-6 ${ROW_GRID}`}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{doc.document_type === "terms_and_conditions" ? t("legalDocuments.termsAndConditions") : t("legalDocuments.privacyPolicy")}</p>
                        <p className="text-xs text-muted md:hidden">v{doc.version} · {formatDate(doc.effective_date)}</p>
                      </div>
                      <p className="font-mono text-sm text-muted md:text-foreground">v{doc.version}</p>
                      <div><LegalStatusBadge status={doc.status} /></div>
                      <p className="text-sm text-muted">{formatDate(doc.effective_date)}</p>
                      <p className="text-sm text-muted">{formatDate(doc.published_at)}</p>
                    </Link>
                  </li>
                ))}
            </ul>
          </>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} totalItems={query.data?.meta.total_items} onPageChange={(next) => setParams({ page: next })} />
    </div>
  );
}
