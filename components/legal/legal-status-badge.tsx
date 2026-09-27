import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";

export function LegalStatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  if (status === "published") return <Badge tone="success">{t("legalDocuments.statusPublished")}</Badge>;
  if (status === "archived") return <Badge tone="neutral">{t("legalDocuments.statusArchived")}</Badge>;
  return <Badge tone="brand">{t("legalDocuments.statusDraft")}</Badge>;
}
