import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import type { KycStatus } from "@/lib/auth/types";

const TONE_BY_STATUS: Record<KycStatus, "neutral" | "brand" | "success" | "danger"> = {
  not_started: "neutral",
  pending: "brand",
  in_review: "brand",
  approved: "success",
  declined: "danger",
  expired: "danger",
};

const LABEL_BY_STATUS = {
  not_started: "users.kycNotStarted",
  pending: "users.kycPending",
  in_review: "users.kycInReview",
  approved: "users.kycApproved",
  declined: "users.kycDeclined",
  expired: "users.kycExpired",
} as const;

export function KycStatusBadge({ status }: { status: KycStatus | null }) {
  const { t } = useI18n();
  if (!status) return <Badge tone="neutral">{t("users.kycNotApplicable")}</Badge>;
  return <Badge tone={TONE_BY_STATUS[status]}>{t(LABEL_BY_STATUS[status])}</Badge>;
}
