"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        {t("common.previous")}
      </Button>
      <p className="text-sm text-muted">
        {t("common.page")} {page} / {totalPages}
        {totalItems !== undefined ? ` · ${totalItems}` : ""}
      </p>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        {t("common.next")}
      </Button>
    </div>
  );
}
