import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readAuthToken } from "./next-auth-cookie";
import { getLocalizedPath } from "@/lib/i18n/server";

// No upstream requests from pages. Fresh account data is queried through /api/proxy.
export const requireAdmin = cache(async () => {
  const token = await readAuthToken();
  if (token?.authStep !== "authenticated" || !token.tokens || !token.user || token.authError === "SessionExpired") redirect(await getLocalizedPath("/login"));
  if ((token.expiresAt ?? 0) < Date.now() + 60000) redirect(await getLocalizedPath("/session/refresh"));
  if (token.user.user_type !== "admin" || !token.user.is_two_factor_enabled) redirect(await getLocalizedPath("/login?reason=forbidden"));
  return token.user;
});
