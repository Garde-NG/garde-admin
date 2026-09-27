"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";

type Mode = "login" | "forgot" | "reset" | "change";
export function AuthForm({ mode }: { mode: Mode }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const newPassword = mode === "reset" || mode === "change";
  return (
    <form className="space-y-5" onSubmit={(event) => {
      event.preventDefault();
      setError("");
      setMessage("");
      if (newPassword && password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
      setMessage("This preview is not connected yet. No account changes have been made.");
    }}>
      {message && <Alert>{message}</Alert>}
      {mode === "login" && <Field label="Username, email or phone" name="identifier" autoComplete="username" required />}
      {mode === "forgot" && <Field label="Email" name="email" type="email" autoComplete="email" required />}
      {mode === "change" && <PasswordField label="Current password" autoComplete="current-password" required />}
      {mode !== "forgot" && <PasswordField label={newPassword ? "New password" : "Password"} autoComplete={newPassword ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required showStrength={newPassword} />}
      {newPassword && <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required error={error} />}
      {mode === "login" && <div className="text-right"><Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">Forgot password?</Link></div>}
      <Button type="submit" fullWidth>{mode === "login" ? "Sign in" : mode === "forgot" ? "Send reset link" : mode === "change" ? "Change password" : "Reset password"}</Button>
      {mode === "login" && <div className="border-t border-border pt-5 text-center"><Link href="/dashboard" className="text-sm font-medium text-brand hover:underline">Preview dashboard</Link><p className="mt-2 text-xs text-muted">Preview only. Sign-in is not connected yet.</p></div>}
    </form>
  );
}
