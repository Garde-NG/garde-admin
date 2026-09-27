import type { JWT } from "next-auth/jwt";
import type { Tokens, TwoFactorMethod, User } from "./types";
export const SESSION_COOKIE = "garde-next-auth";
export const SESSION_MAX_AGE = 86400;
export const sessionCookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, path: "/",
};
export function authSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Set NEXTAUTH_SECRET to at least 32 random characters.");
  return secret;
}
export interface GardeToken extends JWT {
  authStep?: "authenticated" | "two_factor";
  tokens?: Tokens;
  expiresAt?: number;
  user?: User;
  pending?: { token: string; expiresAt: number; setup: boolean; method: TwoFactorMethod | null };
  authError?: "SessionExpired" | "ServiceUnavailable";
}
