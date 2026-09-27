"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
export default function AppError({ reset }: { reset: () => void }) {
  const { href, t } = useI18n();
  return <main className="m-auto max-w-md space-y-4 p-8"><h1 className="text-xl font-semibold">{t("api.genericFailure")}</h1><p className="text-sm text-muted">{t("api.accountServiceUnavailable")}</p><div className="flex items-center gap-4"><Button onClick={reset}>{t("common.tryAgain")}</Button><Link href={href("/login")} className="text-sm text-brand">{t("common.backToSignIn")}</Link></div></main>;
}
