"use client";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { AuthError, messageOf } from "@/lib/auth/client";
import { useAuthMutation, useSignIn } from "@/lib/query/auth";
import type { Setup, TwoFactorMethod } from "@/lib/auth/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function TwoFactor({ setupRequired, method, changing = false, onDone, onCancel }: {
  setupRequired: boolean; method: TwoFactorMethod | null; changing?: boolean;
  onDone: () => void; onCancel: () => void;
}) {
  const setupMutation = useAuthMutation<Setup>();
  const methodMutation = useAuthMutation();
  const signInMutation = useSignIn();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [selected, setSelected] = useState<TwoFactorMethod>("email_otp");
  const needsSetup = setupRequired || changing;
  const current = setup?.method ?? method;
  const choosing = needsSetup && !setup;
  async function start() {
    setBusy(true); setError("");
    try { setSetup(await setupMutation.mutateAsync({ operation: changing ? "2fa/method" : "2fa/setup", body: { method: selected } })); }
    catch (error) { setError(messageOf(error)); if (error instanceof AuthError && error.status === 401) setExpired(true); }
    finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setError("");
    try {
      if (changing) await methodMutation.mutateAsync({ operation: "2fa/verify-method", body: { code, method: current } });
      else await signInMutation.mutateAsync({ mode: "verify", code });
      onDone();
    } catch (error) {
      setError(messageOf(error)); setCode("");
      // Pending challenges can be consumed even when verification fails.
      if (!changing) setExpired(true);
    }
    finally { setBusy(false); }
  }
  return <div className="space-y-5">
    {error && <Alert tone="error">{error}</Alert>}
    {choosing ? <>
      <p className="text-sm text-muted">{changing ? "Your current method stays active until you verify the new one." : "Set up two-factor authentication to secure your admin account."}</p>
      <fieldset disabled={busy || expired} className="space-y-3">
        <legend className="sr-only">Verification method</legend>
        {([["email_otp", "Email verification", "Receive a 6-digit code by email."], ["totp", "Authenticator app", "Use codes from your authenticator app."]] as const).map(([value, title, description]) =>
          <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${selected === value ? "border-brand bg-brand-soft" : "border-border"}`}>
            <input type="radio" name="method" value={value} checked={selected === value} onChange={() => setSelected(value)} className="mt-1 accent-brand" />
            <span><span className="block text-sm font-semibold">{title}</span><span className="text-sm text-muted">{description}</span></span>
          </label>)}
      </fieldset>
      <Button fullWidth loading={busy} disabled={expired} onClick={start}>Continue</Button>
    </> : <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void verify(); }}>
      {current === "totp" && setup ? <div className="space-y-3">
        <p className="text-sm text-muted">Scan this QR code with your authenticator app, then enter its current code.</p>
        {setup.totp_otpauth_uri && <div className="w-fit rounded-xl bg-white p-4"><QRCodeSVG value={setup.totp_otpauth_uri} size={180} title="Scan to add Garde to your authenticator" /></div>}
        <p className="text-xs text-muted">Or enter this setup key manually:</p>
        <code className="block break-all rounded-lg bg-subtle p-3 text-sm select-all">{setup.totp_secret}</code>
      </div> : <p className="text-sm text-muted">{current === "totp" ? "Enter the 6-digit code from your authenticator app." : "Enter the 6-digit code sent to your email."}</p>}
      <Field label="Verification code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} required disabled={busy || expired} />
      <Button type="submit" fullWidth loading={busy} disabled={expired || code.length !== 6}>Verify and continue</Button>
      {expired && <p className="text-sm text-muted">Please return to sign in to start a fresh verification.</p>}
      {!changing && <p className="text-xs text-muted">Expired or missing code? Return to sign in to start a new verification.</p>}
    </form>}
    <Button variant="ghost" fullWidth disabled={busy} onClick={onCancel}>{changing ? "Cancel" : "Back to sign in"}</Button>
  </div>;
}
