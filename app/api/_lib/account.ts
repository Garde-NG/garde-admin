import { clearAuthCookie, readAuthToken, writeAuthToken } from "@/lib/auth/next-auth-cookie";
import type { GardeToken } from "@/lib/auth/next-auth-shared";
import type { User } from "@/lib/auth/types";
import { dictionaryFor, type Locale } from "@/lib/i18n/config";
import { ApiError, upstream } from "./upstream";
import { refreshToken, shouldRefresh } from "./token";

async function refresh(token: GardeToken, locale: Locale) {
  const dict = dictionaryFor(locale);
  const next = await refreshToken(token);
  if (next.authError === "SessionExpired") {
    await clearAuthCookie();
    throw new ApiError(401, dict.api.sessionEnded);
  }
  if (next.authError) throw new ApiError(503, dict.api.accountServiceUnavailable);
  await writeAuthToken(next);
  return next;
}

export async function requireApiAccount(locale: Locale) {
  const dict = dictionaryFor(locale);
  let token = await readAuthToken();
  if (token?.authStep !== "authenticated" || !token.tokens) throw new ApiError(401, dict.api.signInAgain);
  if (shouldRefresh(token)) token = await refresh(token, locale);
  let user: User;
  try {
    user = await upstream<User>("me", undefined, token.tokens!.access_token, locale);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    token = await refresh(token, locale);
    try {
      user = await upstream<User>("me", undefined, token.tokens!.access_token, locale);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) await clearAuthCookie();
      throw error;
    }
  }
  if (user.user_type !== "admin" || !user.is_two_factor_enabled) {
    await clearAuthCookie();
    throw new ApiError(403, dict.api.adminRestricted);
  }
  token.user = user;
  await writeAuthToken(token);
  return { token, user };
}
