import { NextRequest, NextResponse } from "next/server";
import { contracts, privateOperations, type AuthOperation } from "@/lib/auth/contracts";
import { clearAuthCookie, readAuthToken, writeAuthToken } from "@/lib/auth/next-auth-cookie";
import type { Setup, User } from "@/lib/auth/types";
import { ApiError, upstream } from "../../_lib/upstream";
import { dictionaryFor } from "@/lib/i18n/config";
import { requireApiAccount } from "../../_lib/account";
import { localeFromRequest } from "../../_lib/request-locale";
export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store" };
const publicOperations = new Set(["forgot-password", "reset-password", "restore-account", "webauthn/login/options", "2fa/setup"]);
function success(data: unknown = null) { return NextResponse.json({ success: true, data }, { headers: noStore }); }
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const locale = localeFromRequest(request);
  const dict = dictionaryFor(locale);
  try {
    const [group, ...parts] = (await context.params).path;
    const operation = parts.join("/") as AuthOperation;
    if (group !== "auth") throw new ApiError(404, dict.api.notFound);
    if (request.method === "GET") {
      if (parts.join("/") !== "me") throw new ApiError(404, dict.api.notFound);
      return success((await requireApiAccount(locale)).user);
    }
    if (request.headers.get("origin") !== (process.env.APP_ORIGIN || request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site")
      throw new ApiError(403, dict.api.originNotAllowed);
    // Token-issuing operations must use NextAuth, never the generic gateway.
    if (!publicOperations.has(operation) && !privateOperations.has(operation)) throw new ApiError(404, dict.api.notFound);
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415, dict.api.jsonExpected);
    const raw = await request.text();
    if (raw.length > 65536) throw new ApiError(413, dict.api.requestTooLarge);
    let input: unknown;
    try { input = JSON.parse(raw); } catch { throw new ApiError(400, dict.api.invalidJson); }
    const parsed = contracts[operation].safeParse(input);
    if (!parsed.success) throw new ApiError(422, dict.api.checkFields, parsed.error.issues.map(issue => ({ field: String(issue.path[0]), message: issue.message })));
    if (privateOperations.has(operation)) {
      const { token } = await requireApiAccount(locale);
      // An action's 401 can mean wrong password/code; do not invalidate the session.
      const data = await upstream(operation, parsed.data, token.tokens!.access_token, locale);
      if (operation === "close-account") await clearAuthCookie();
      if (operation === "2fa/verify-method") await writeAuthToken({ ...token, user: data as User });
      return success(data);
    }
    if (operation === "2fa/setup") {
      const token = await readAuthToken();
      const pending = token?.pending;
      if (!token || !pending?.setup || pending.expiresAt <= Date.now()) throw new ApiError(401, dict.api.verificationExpired);
      const result = await upstream<Setup>(operation, { ...parsed.data, pending_token: pending.token }, undefined, locale);
      if (!result.pending_token) throw new ApiError(502, dict.api.authServiceIncomplete);
      await writeAuthToken({ ...token, pending: { token: result.pending_token, expiresAt: Date.now() + 300000, setup: true, method: result.method } });
      return success({ method: result.method, totp_secret: result.totp_secret, totp_otpauth_uri: result.totp_otpauth_uri });
    }
    const data = await upstream(operation, parsed.data, undefined, locale);
    if (operation === "reset-password") await clearAuthCookie();
    return success(operation === "restore-account" ? null : data);
  } catch (error) {
    const known = error instanceof ApiError;
    return NextResponse.json({ success: false, message: known ? error.message : dict.api.genericFailure, errors: known ? error.errors : [] },
      { status: known ? error.status : 500, headers: { ...noStore, ...(known && error.retryAfter ? { "Retry-After": error.retryAfter } : {}) } });
  }
}
export { handle as GET, handle as POST };
