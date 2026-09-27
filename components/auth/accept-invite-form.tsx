"use client";

import Link from "next/link";
import { useState } from "react";
import { getSession } from "next-auth/react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { TwoFactor } from "@/components/auth/two-factor";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import { messageOf } from "@/lib/auth/client";
import { useI18n } from "@/lib/i18n/provider";
import { useSignIn } from "@/lib/query/auth";

export function AcceptInviteForm({ token }: { token: string }) {
  const { href, t } = useI18n();
  const toast = useToast();
  const signInMutation = useSignIn();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [challenge, setChallenge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const accept = async () => {
    setError("");
    if (!token) {
      setError(t("auth.inviteInvalid"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      const session = await signInMutation.mutateAsync({ mode: "accept-invite", token, password });
      if (!session.challenge?.setupRequired) throw new Error(t("api.verificationExpired"));
      setPassword("");
      setConfirmPassword("");
      setChallenge(true);
    } catch (error) {
      const message = messageOf(error);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const done = async () => {
    const session = await getSession();
    if (!session?.user) throw new Error(t("api.sessionLoadFailed"));
    window.location.replace(href("/dashboard"));
  };

  if (challenge) {
    return (
      <AuthPanel title={t("twoFactor.secureAccount")} description={t("twoFactor.verifyDescription")}>
        <TwoFactor
          setupRequired
          method={null}
          onDone={() => {
            void done().catch((error) => toast.error(messageOf(error)));
          }}
          onCancel={() => setChallenge(false)}
        />
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title={t("auth.acceptInviteTitle")}
      description={token ? t("auth.acceptInviteDescription") : t("auth.inviteInvalid")}
      footer={<Link href={href("/login")} className="font-medium text-brand hover:underline">{t("common.backToSignIn")}</Link>}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void accept();
        }}
      >
        <PasswordField
          label={t("auth.newPassword")}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          showStrength
          disabled={busy || !token}
        />
        <PasswordField
          label={t("auth.confirmNewPassword")}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          disabled={busy || !token}
        />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" fullWidth loading={busy} disabled={!token}>
          {t("auth.acceptInvite")}
        </Button>
      </form>
    </AuthPanel>
  );
}
