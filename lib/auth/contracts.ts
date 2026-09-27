import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());
const password = z.string().min(1).max(1024);
const newPassword = z.string().min(8, "Use at least 8 characters.").max(128, "Use at most 128 characters.");
const code = z.string().regex(/^\d{6}$/, "Enter a 6-digit code.");
const method = z.enum(["email_otp", "totp"]);
const credential = z.record(z.string(), z.unknown());
export const contracts = {
  login: z.object({ email, password }),
  "accept-invite": z.object({ token: z.string().min(1), password: newPassword }),
  "2fa/setup": z.object({ method }),
  "2fa/verify-setup": z.object({ code }),
  "2fa/verify-login": z.object({ code }),
  "forgot-password": z.object({ email }),
  "reset-password": z.object({ email, otp: code, new_password: newPassword }),
  "restore-account": z.object({ email, password }),
  "webauthn/login/options": z.object({ email }),
  "webauthn/login/verify": z.object({ email, credential }),
  "change-password": z.object({ current_password: password, new_password: newPassword }),
  "2fa/method": z.object({ method }),
  "2fa/verify-method": z.object({ method, code }),
  "webauthn/register/options": z.object({}),
  "webauthn/register/verify": z.object({ credential }),
  "close-account": z.object({ password }),
  logout: z.object({}),
  refresh: z.object({}),
} as const;
export type AuthOperation = keyof typeof contracts;
export const privateOperations = new Set<AuthOperation>([
  "change-password", "2fa/method", "2fa/verify-method",
  "webauthn/register/options", "webauthn/register/verify", "close-account",
]);
export function safeReturnPath(value: string | null): string {
  return value && /^(?:\/(?:en|fr))?\/(dashboard|settings(?:\/profile|\/security)?)(?:\?[^\\]*)?$/.test(value)
    ? value : "/dashboard";
}
