import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import type { AdminUser } from "@/lib/users/types";

export function UserStatusBadge({ user }: { user: AdminUser }) {
  const { t } = useI18n();
  if (user.is_deleted) return <Badge tone="danger">{t("users.statusDeleted")}</Badge>;
  if (user.is_suspended) return <Badge tone="danger">{t("users.statusSuspended")}</Badge>;
  if (user.is_invite_pending) return <Badge tone="neutral">{t("users.statusInvitePending")}</Badge>;
  return <Badge tone="success">{t("users.statusActive")}</Badge>;
}
