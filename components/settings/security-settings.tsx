"use client";
import { useEffect, useRef, useState } from "react";
import { startRegistration, type PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { useUser } from "@/lib/query/user";
import { AuthForm } from "@/components/auth/auth-form";
import { TwoFactor } from "@/components/auth/two-factor";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { messageOf } from "@/lib/auth/client";
import { useAuthMutation } from "@/lib/query/auth";
import { rememberPasskey } from "@/lib/auth/passkey";

export function SecuritySettings() {
  const optionsMutation = useAuthMutation<{ options: PublicKeyCredentialCreationOptionsJSON }>();
  const mutation = useAuthMutation();
  const { user, refreshUser } = useUser();
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [closing, setClosing] = useState(false);
  const [password, setPassword] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (closing) dialog.current?.showModal();
    else dialog.current?.close();
  }, [closing]);
  async function registerPasskey() {
    setBusy(true); setError(""); setNotice("");
    try {
      if (!window.PublicKeyCredential || !window.isSecureContext) throw new Error("Passkeys require a supported browser on HTTPS or localhost.");
      const { options } = await optionsMutation.mutateAsync({ operation: "webauthn/register/options", body: {} });
      const credential = await startRegistration({ optionsJSON: options });
      await mutation.mutateAsync({ operation: "webauthn/register/verify", body: { credential } });
      rememberPasskey(user.email);
      await refreshUser();
      setNotice("Passkey registered. You can use it the next time you sign in on this browser.");
    } catch (error) { setError(messageOf(error)); }
    finally { setBusy(false); }
  }
  async function closeAccount() {
    setBusy(true); setError("");
    try {
      await mutation.mutateAsync({ operation: "close-account", body: { password } });
      window.location.replace("/login?reason=closed");
    } catch (error) { setError(messageOf(error)); }
    finally { setBusy(false); }
  }
  const card = "rounded-xl border border-border bg-surface p-5 sm:p-6";
  return <div className="space-y-5">
    {error && !closing && <Alert tone="error">{error}</Alert>}
    {notice && <Alert tone="success">{notice}</Alert>}
    <section className={card}>
      <h2 className="font-semibold">Two-factor authentication</h2>
      <p className="mt-1 mb-5 text-sm text-muted">Required for your account. Current method: {user.two_factor_method === "totp" ? "Authenticator app" : "Email verification"}.</p>
      {changing ? <TwoFactor changing setupRequired={false} method={user.two_factor_method}
        onDone={() => { setChanging(false); void refreshUser().then(() => setNotice("Verification method updated.")).catch(error => setError(messageOf(error))); }}
        onCancel={() => setChanging(false)} /> : <Button variant="secondary" onClick={() => { setChanging(true); setError(""); setNotice(""); }}>Change verification method</Button>}
    </section>
    <section className={card}>
      <h2 className="font-semibold">Passkeys</h2>
      <p className="mt-1 mb-5 text-sm text-muted">Use Face ID, your fingerprint, Windows Hello, or a security key to sign in without a password.</p>
      {user.is_passwordless_enabled && <p className="mb-4 text-sm text-success">Passkey sign-in is enabled.</p>}
      <Button variant="secondary" loading={busy && !closing} onClick={registerPasskey}>{user.is_passwordless_enabled ? "Add another passkey" : "Enable passkey sign-in"}</Button>
    </section>
    <section className={card}><h2 className="mb-5 font-semibold">Change password</h2><AuthForm mode="change" /></section>
    <section className="rounded-xl border border-danger/30 bg-surface p-5 sm:p-6">
      <h2 className="font-semibold">Close account</h2>
      <p className="mt-1 mb-5 text-sm text-muted">Closing your account signs you out of all sessions. You have 7 days to restore it before it becomes eligible for permanent deletion.</p>
      <Button variant="danger" onClick={() => { setPassword(""); setError(""); setClosing(true); }}>Close account</Button>
    </section>
    <dialog ref={dialog} aria-labelledby="close-title" onCancel={(event) => { if (busy) event.preventDefault(); }} onClose={() => { setClosing(false); setPassword(""); setError(""); }} className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-border bg-surface p-6 text-foreground shadow-card backdrop:bg-black/60">
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void closeAccount(); }}>
        <h2 id="close-title" className="text-xl font-semibold">Close your account?</h2>
        <p className="text-sm text-muted">All sessions will end. You can restore your account within 7 days using your email and password.</p>
        {error && <Alert tone="error">{error}</Alert>}
        <PasswordField label="Confirm your password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} />
        <div className="flex justify-end gap-3"><Button variant="secondary" disabled={busy} onClick={() => setClosing(false)}>Cancel</Button><Button variant="danger" type="submit" loading={busy}>Close account</Button></div>
      </form>
    </dialog>
  </div>;
}
