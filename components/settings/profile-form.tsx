"use client";
import { Field } from "@/components/ui/field";
import { useUser } from "@/lib/query/user";
import { useI18n } from "@/lib/i18n/provider";

export function ProfileForm() {
  const { user } = useUser();
  const { t } = useI18n();
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t("profile.firstName")} value={user.first_name} readOnly />
      <Field label={t("profile.lastName")} value={user.last_name} readOnly />
      <Field label={t("common.email")} value={user.email} readOnly />
      <Field label={t("profile.phone")} value={user.phone_number ?? "-"} readOnly />
      <Field label={t("profile.role")} value={t("common.administrator")} readOnly />
      <Field label={t("profile.twoFactorAuthentication")} value={user.two_factor_method === "totp" ? t("twoFactor.authenticatorApp") : t("auth.emailVerification")} readOnly />
    </div>
    <p className="text-sm text-muted">{t("profile.contactAdmin")}</p>
  </div>;
}
