"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { AuthPanel } from "./auth-panel";
import { TwoFactor } from "./two-factor";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { AuthError, messageOf } from "@/lib/auth/client";
import { useAuthMutation, useSignIn } from "@/lib/query/auth";
import { getSession } from "next-auth/react";
import type { TwoFactorMethod } from "@/lib/auth/types";
import { hasKnownPasskey, rememberPasskey, subscribePasskey } from "@/lib/auth/passkey";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/provider";

export function LoginForm({ notice }: { notice?: string }) {
  const signInMutation = useSignIn();
  const passkeyOptions = useAuthMutation<{ options: PublicKeyCredentialRequestOptionsJSON }>();
  const toast = useToast();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState<{ setupRequired: boolean; method: TwoFactorMethod | null } | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const knownPasskey = useSyncExternalStore(subscribePasskey, () => hasKnownPasskey(email), () => false);
  useEffect(() => {
    if (notice) toast.info(notice);
  }, [notice, toast]);
  async function signIn(passkey = false) {
    setBusy(true); setFields({});
    try {
      if (passkey) {
        const { options } = await passkeyOptions.mutateAsync({ operation: "webauthn/login/options", body: { email } });
        const credential = await startAuthentication({ optionsJSON: options });
        await signInMutation.mutateAsync({ mode: "passkey", email, credential: JSON.stringify(credential) });
        window.location.replace("/dashboard");
      } else {
        const session = await signInMutation.mutateAsync({ mode: "password", email, password });
        if (!session.challenge) throw new Error(t("api.verificationExpired"));
        setChallenge(session.challenge);
        setPassword("");
      }
    } catch (error) { toast.error(messageOf(error)); if (error instanceof AuthError) setFields(error.fields); }
    finally { setBusy(false); }
  }
  async function done() {
    const session = await getSession();
    if (session?.user?.is_passwordless_enabled) rememberPasskey(session.user.email);
    window.location.replace("/dashboard");
  }
  return <AuthPanel title={challenge ? challenge.setupRequired ? t("twoFactor.secureAccount") : t("twoFactor.verifySignIn") : t("auth.signInTitle")} description={challenge ? t("twoFactor.verifyDescription") : t("auth.signInDescription")}>
    {challenge ? <TwoFactor setupRequired={challenge.setupRequired} method={challenge.method} onDone={() => { void done().catch(error => toast.error(messageOf(error))); }} onCancel={() => setChallenge(null)} /> :
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void signIn(); }}>
        <Field label={t("common.email")} name="email" type="email" autoComplete="username webauthn" required value={email} onChange={(event) => setEmail(event.target.value)} error={fields.email} disabled={busy} />
        <PasswordField label={t("common.password")} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required error={fields.password} disabled={busy} />
        <div className="text-right"><Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">{t("auth.forgotPasswordLink")}</Link></div>
        <Button type="submit" fullWidth loading={busy}>{t("auth.signIn")}</Button>
        {knownPasskey && <Button variant="secondary" fullWidth disabled={busy || !email} onClick={() => void signIn(true)}>{t("auth.passkeySignIn")}</Button>}
        <p className="text-center text-xs text-muted">{t("auth.accountInviteOnly")}</p>
      </form>}
  </AuthPanel>;
}
