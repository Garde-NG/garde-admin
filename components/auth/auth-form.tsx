"use client";
import { useState } from "react";
import { AuthError, messageOf } from "@/lib/auth/client";
import { useAuthMutation } from "@/lib/query/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";

type Mode = "forgot" | "reset" | "change" | "restore";
export function AuthForm({ mode }: { mode: Mode }) {
  const mutation = useAuthMutation();
  const toast = useToast();
  const { href, t } = useI18n();
  const [resetting, setResetting] = useState(mode === "reset");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const newPassword = resetting || mode === "change";
  async function submit() {
    setFields({});
    if (newPassword && password !== confirm) { setFields({ confirm: t("auth.passwordMismatch") }); return; }
    setBusy(true);
    try {
      if (mode === "forgot" && !resetting) {
        await mutation.mutateAsync({ operation: "forgot-password", body: { email } });
        setResetting(true);
        toast.success(t("auth.resetCodeSent"));
      } else if (resetting) {
        await mutation.mutateAsync({ operation: "reset-password", body: { email, otp, new_password: password } });
        window.location.replace(href("/login?reason=reset"));
      } else if (mode === "restore") {
        await mutation.mutateAsync({ operation: "restore-account", body: { email, password } });
        window.location.replace(href("/login?reason=restored"));
      } else {
        await mutation.mutateAsync({ operation: "change-password", body: { current_password: current, new_password: password } });
        setPassword(""); setConfirm(""); setCurrent("");
        toast.success(t("auth.passwordChanged"));
      }
    } catch (error) { toast.error(messageOf(error)); if (error instanceof AuthError) setFields(error.fields); }
    finally { setBusy(false); }
  }
  return <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
    {mode !== "change" && <Field label={t("common.email")} type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} error={fields.email} />}
    {resetting && <Field label={t("auth.resetCode")} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} required disabled={busy} error={fields.otp} />}
    {mode === "change" && <PasswordField label={t("auth.currentPassword")} autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} required disabled={busy} error={fields.current_password} />}
    {(newPassword || mode === "restore") && <PasswordField label={newPassword ? t("auth.newPassword") : t("common.password")} autoComplete={newPassword ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={newPassword ? 8 : undefined} showStrength={newPassword} disabled={busy} error={fields.new_password || fields.password} />}
    {newPassword && <PasswordField label={t("auth.confirmNewPassword")} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required disabled={busy} error={fields.confirm} />}
    <Button type="submit" fullWidth loading={busy}>{resetting ? t("auth.resetPassword") : mode === "forgot" ? t("auth.sendResetCode") : mode === "restore" ? t("auth.restoreAccount") : t("auth.changePassword")}</Button>
    {resetting && mode === "forgot" && <Button variant="ghost" fullWidth disabled={busy} onClick={() => { setResetting(false); setOtp(""); }}>{t("auth.requestNewCode")}</Button>}
  </form>;
}
