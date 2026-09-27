"use client";
import { useEffect } from "react";
import { getSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { authRequest, AuthError, messageOf } from "@/lib/auth/client";
import { AuthPanel } from "@/components/auth/auth-panel";
import { Button } from "@/components/ui/button";
import { safeReturnPath } from "@/lib/auth/contracts";
import { useI18n } from "@/lib/i18n/provider";

export default function RefreshPage() {
  const { t } = useI18n();
  const query = useQuery({
    queryKey: ["session", "restore"], retry: false, staleTime: 0,
    queryFn: async () => {
      const session = await getSession();
      if (session?.authError === "ServiceUnavailable") throw new Error(t("api.accountServiceUnavailable"));
      if (session?.authStep !== "authenticated" || session.authError) throw new AuthError(401, t("api.verificationExpiredShort"));
      return authRequest("me");
    },
  });
  useEffect(() => {
    if (query.isSuccess) window.location.replace(safeReturnPath(new URLSearchParams(window.location.search).get("next")));
    if (query.error instanceof AuthError && [401, 403].includes(query.error.status)) window.location.replace("/login?reason=expired");
  }, [query.isSuccess, query.error]);
  return <AuthPanel title={t("auth.restoringSession")} description={query.error ? messageOf(query.error) : t("auth.sessionWait")}>{query.isError && <Button onClick={() => void query.refetch()}>{t("common.tryAgain")}</Button>}</AuthPanel>;
}
