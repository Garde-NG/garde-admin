import { createHash } from "node:crypto";
import type { GardeToken } from "@/lib/auth/next-auth-shared";
import type { Tokens, User } from "@/lib/auth/types";
import { ApiError, upstream } from "./upstream";
import { defaultLocale, dictionaryFor, type Locale } from "@/lib/i18n/config";
const refreshes = new Map<string, Promise<Tokens>>();
export async function refreshToken(token: GardeToken): Promise<GardeToken> {
  if (!token.tokens) return { ...token, authError: "SessionExpired" };
  const key = createHash("sha256").update(token.tokens.refresh_token).digest("hex");
  let request = refreshes.get(key);
  if (!request) {
    request = upstream<Tokens>("refresh", { refresh_token: token.tokens.refresh_token });
    refreshes.set(key, request);
    setTimeout(() => refreshes.delete(key), 15000).unref();
  }
  try {
    const tokens = await request;
    return { ...token, tokens, expiresAt: Date.now() + tokens.expires_in * 1000, authError: undefined };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      return { ...token, tokens: undefined, user: undefined, authStep: undefined, authError: "SessionExpired" };
    return { ...token, authError: "ServiceUnavailable" };
  }
}
export function shouldRefresh(token: GardeToken) {
  return token.authStep === "authenticated" && !!token.tokens && (token.expiresAt ?? 0) < Date.now() + 60000;
}
export async function tokenFromLogin(result: Tokens & { user: User }, locale: Locale = defaultLocale): Promise<GardeToken> {
  const dict = dictionaryFor(locale);
  if (!result.access_token || !result.refresh_token || !result.user) throw new ApiError(502, dict.api.invalidSignInResponse);
  if (result.user.user_type !== "admin" || !result.user.is_two_factor_enabled) {
    await upstream("logout", { refresh_token: result.refresh_token }, undefined, locale).catch(() => undefined);
    throw new ApiError(403, dict.api.adminRestricted);
  }
  return {
    sub: result.user.id, authStep: "authenticated", user: result.user,
    tokens: { access_token: result.access_token, refresh_token: result.refresh_token, expires_in: result.expires_in },
    expiresAt: Date.now() + result.expires_in * 1000,
  };
}
