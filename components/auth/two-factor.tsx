"use client";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { AuthError, messageOf } from "@/lib/auth/client";
import { useAuthMutation, useSignIn } from "@/lib/query/auth";
import type { Setup, TwoFactorMethod } from "@/lib/auth/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CodeField } from "@/components/ui/code-field";

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
  const [selected, setSelected] = useState<TwoFactorMethod>(() => method === "totp" ? "email_otp" : method === "email_otp" ? "totp" : "email_otp");
  const needsSetup = setupRequired || changing;
  const current = setup?.method ?? method;
  const choosing = needsSetup && !setup;
  async function start() {
    setBusy(true); setError("");
    try { setSetup(await setupMutation.mutateAsync({ operation: changing ? "2fa/method" : "2fa/setup", body: { method: selected } })); }
    catch (error) { setError(messageOf(error)); if (error instanceof AuthError && error.status === 401) setExpired(true); }
    finally { setBusy(false); }
  }
  async function verify(nextCode = code) {
    setBusy(true); setError("");
    try {
      if (changing) await methodMutation.mutateAsync({ operation: "2fa/verify-method", body: { code: nextCode, method: current } });
      else await signInMutation.mutateAsync({ mode: "verify", code: nextCode });
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
        {([["email_otp", "Email verification", "Receive a 6-digit code by email."], ["totp", "Authenticator app", "Use codes from your authenticator app."]] as const).map(([value, title, description]) => {
          const isCurrent = changing && method === value;
          return (
            <label key={value} className={`flex gap-3 rounded-xl border p-4 ${isCurrent ? "cursor-not-allowed border-border bg-subtle opacity-75" : "cursor-pointer"} ${selected === value && !isCurrent ? "border-brand bg-brand-soft" : "border-border"}`}>
              <input type="radio" name="method" value={value} checked={selected === value && !isCurrent} disabled={isCurrent} onChange={() => setSelected(value)} className="mt-1 accent-brand disabled:cursor-not-allowed" />
              <span className="min-w-0"><span className="flex flex-wrap items-center gap-2 text-sm font-semibold">{title}{isCurrent && <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">Current method</span>}</span><span className="text-sm text-muted">{isCurrent ? "This is already your active security method." : description}</span></span>
            </label>
          );
        })}
      </fieldset>
      <Button fullWidth loading={busy} disabled={expired} onClick={start}>Continue</Button>
    </> : <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void verify(); }}>
      {current === "totp" && setup ? <div className="space-y-3">
        <p className="text-sm text-muted">Scan this QR code with your authenticator app, then enter its current code.</p>
        {setup.totp_otpauth_uri && <div className="flex justify-center rounded-lg bg-white p-3"><QRCodeSVG value={setup.totp_otpauth_uri} size={176} title="Scan to add Garde to your authenticator" className="h-auto w-full max-w-44 [@media(max-height:640px)]:max-w-32" /></div>}
        <p className="text-xs text-muted">Or enter this setup key manually:</p>
        <code className="block break-all rounded-lg border border-border bg-subtle p-3 font-mono text-xs select-all">{setup.totp_secret}</code>
      </div> : <p className="text-sm text-muted">{current === "totp" ? "Enter the 6-digit code from your authenticator app." : "Enter the 6-digit code sent to your email."}</p>}
      <CodeField label={current === "totp" ? "Code from your app" : "Verification code"} value={code} onChange={setCode} onComplete={(nextCode) => { void verify(nextCode); }} disabled={busy || expired} autoFocus />
      <Button type="submit" fullWidth loading={busy} disabled={expired || code.length !== 6}>Verify and continue</Button>
      {expired && <p className="text-sm text-muted">Please return to sign in to start a fresh verification.</p>}
      {!changing && <p className="text-xs text-muted">Expired or missing code? Return to sign in to start a new verification.</p>}
    </form>}
    <Button variant="ghost" fullWidth disabled={busy} onClick={onCancel}>{changing ? "Cancel" : "Back to sign in"}</Button>
  </div>;
}
