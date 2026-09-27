"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { startRegistration, type PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { useUser } from "@/lib/query/user";
import { AuthForm } from "@/components/auth/auth-form";
import { TwoFactor } from "@/components/auth/two-factor";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import { messageOf } from "@/lib/auth/client";
import { useAuthMutation } from "@/lib/query/auth";
import { rememberPasskey } from "@/lib/auth/passkey";
import { useI18n } from "@/lib/i18n/provider";

export function SecuritySettings() {
  const optionsMutation = useAuthMutation<{ options: PublicKeyCredentialCreationOptionsJSON }>();
  const mutation = useAuthMutation();
  const { user, refreshUser } = useUser();
  const toast = useToast();
  const { href, t } = useI18n();
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const [password, setPassword] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const currentMethod = user.two_factor_method;
  useEffect(() => {
    if (closing) dialog.current?.showModal();
    else dialog.current?.close();
  }, [closing]);
  async function registerPasskey() {
    setBusy(true); setError("");
    try {
      if (!window.PublicKeyCredential || !window.isSecureContext) throw new Error(t("security.passkeysRequireSecureBrowser"));
      const { options } = await optionsMutation.mutateAsync({ operation: "webauthn/register/options", body: {} });
      const credential = await startRegistration({ optionsJSON: options });
      await mutation.mutateAsync({ operation: "webauthn/register/verify", body: { credential } });
      rememberPasskey(user.email);
      await refreshUser();
      toast.success(t("security.passkeyRegistered"));
    } catch (error) { toast.error(messageOf(error)); }
    finally { setBusy(false); }
  }
  async function closeAccount() {
    setBusy(true); setError("");
    try {
      await mutation.mutateAsync({ operation: "close-account", body: { password } });
      window.location.replace(href("/login?reason=closed"));
    } catch (error) { const message = messageOf(error); setError(message); toast.error(message); }
    finally { setBusy(false); }
  }
  const card = "rounded-xl border border-border bg-surface p-5 sm:p-6";
  return <div className="space-y-5">
    <section className={card}>
      <h2 className="font-semibold">{t("security.twoFactorTitle")}</h2>
      <p className="mt-1 mb-5 text-sm text-muted">{t("security.twoFactorDescription")}</p>
      {changing ? <TwoFactor changing setupRequired={false} method={currentMethod}
        onDone={() => { setChanging(false); void refreshUser().then(() => toast.success(t("security.methodUpdated"))).catch(error => toast.error(messageOf(error))); }}
        onCancel={() => setChanging(false)} /> : <div className="space-y-3">
          <MethodCard
            title={t("auth.emailVerification")}
            description={t("security.emailDescription")}
            active={currentMethod === "email_otp"}
            action={currentMethod === "email_otp" ? <Button variant="secondary" disabled>{t("common.currentMethod")}</Button> : <Button variant="secondary" onClick={() => { setChanging(true); setError(""); }}>{t("security.switchToEmail")}</Button>}
          />
          <MethodCard
            title={t("twoFactor.authenticatorApp")}
            description={t("security.authenticatorDescription")}
            active={currentMethod === "totp"}
            action={currentMethod === "totp" ? <Button variant="secondary" disabled>{t("common.currentMethod")}</Button> : <Button variant="secondary" onClick={() => { setChanging(true); setError(""); }}>{t("security.switchToApp")}</Button>}
          />
        </div>}
    </section>
    <section className={card}>
      <h2 className="font-semibold">{t("security.passkeys")}</h2>
      <p className="mt-1 mb-5 text-sm text-muted">{t("security.passkeysDescription")}</p>
      {user.is_passwordless_enabled && <p className="mb-4 text-sm text-success">{t("security.passkeyEnabled")}</p>}
      <Button variant="secondary" loading={busy && !closing} onClick={registerPasskey}>{user.is_passwordless_enabled ? t("security.addAnotherPasskey") : t("security.enablePasskey")}</Button>
    </section>
    <section className={card}><h2 className="mb-5 font-semibold">{t("security.changePassword")}</h2><AuthForm mode="change" /></section>
    <section className="rounded-xl border border-danger/30 bg-surface p-5 sm:p-6">
      <h2 className="font-semibold">{t("security.closeAccount")}</h2>
      <p className="mt-1 mb-5 text-sm text-muted">{t("security.closeAccountBody")}</p>
      <Button variant="danger" onClick={() => { setPassword(""); setError(""); setClosing(true); }}>{t("security.closeAccount")}</Button>
    </section>
    <dialog ref={dialog} aria-labelledby="close-title" onCancel={(event) => { if (busy) event.preventDefault(); }} onClose={() => { setClosing(false); setPassword(""); setError(""); }} className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-border bg-surface p-6 text-foreground shadow-card backdrop:bg-black/60">
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void closeAccount(); }}>
        <h2 id="close-title" className="text-xl font-semibold">{t("security.closeAccountConfirm")}</h2>
        <p className="text-sm text-muted">{t("security.closeAccountConfirmBody")}</p>
        {error && <Alert tone="error">{error}</Alert>}
        <PasswordField label={t("security.confirmPassword")} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} />
        <div className="flex justify-end gap-3"><Button variant="secondary" disabled={busy} onClick={() => setClosing(false)}>{t("common.cancel")}</Button><Button variant="danger" type="submit" loading={busy}>{t("security.closeAccount")}</Button></div>
      </form>
    </dialog>
  </div>;
}

function MethodCard({ title, description, active, action }: { title: string; description: string; active: boolean; action: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${active ? "border-brand bg-brand-soft" : "border-border bg-surface"}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{title}</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${active ? "bg-success-soft text-success" : "bg-subtle text-muted"}`}>{active ? t("security.yourMethod") : t("common.available")}</span>
        </div>
        <p className="mt-1 text-sm text-muted">{active ? t("security.thisIsCurrentMethod") : description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
