import { NextRequest, NextResponse } from "next/server";
import { contracts, privateOperations, type AuthOperation } from "@/lib/auth/contracts";
import { clearAuthCookie, readAuthToken, writeAuthToken } from "@/lib/auth/next-auth-cookie";
import type { GardeToken } from "@/lib/auth/next-auth-shared";
import type { Setup, User } from "@/lib/auth/types";
import { ApiError, upstream } from "../../_lib/upstream";
import { refreshToken, shouldRefresh } from "../../_lib/token";
export const runtime = "nodejs";
const noStore = { "Cache-Control": "no-store" };
const publicOperations = new Set(["forgot-password", "reset-password", "restore-account", "webauthn/login/options", "2fa/setup"]);
function success(data: unknown = null) { return NextResponse.json({ success: true, data }, { headers: noStore }); }
async function refresh(token: GardeToken) {
  const next = await refreshToken(token);
  if (next.authError === "SessionExpired") {
    await clearAuthCookie();
    throw new ApiError(401, "Your session has ended. Please sign in.");
  }
  if (next.authError) throw new ApiError(503, "The account service is temporarily unavailable.");
  await writeAuthToken(next);
  return next;
}
async function requireAccount() {
  let token = await readAuthToken();
  if (token?.authStep !== "authenticated" || !token.tokens) throw new ApiError(401, "Please sign in.");
  if (shouldRefresh(token)) token = await refresh(token);
  let user: User;
  try { user = await upstream<User>("me", undefined, token.tokens!.access_token); }
  catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    token = await refresh(token);
    try { user = await upstream<User>("me", undefined, token.tokens!.access_token); }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) await clearAuthCookie();
      throw error;
    }
  }
  if (user.user_type !== "admin" || !user.is_two_factor_enabled) {
    await clearAuthCookie();
    throw new ApiError(403, "This platform is restricted to administrators with two-factor authentication.");
  }
  token.user = user;
  await writeAuthToken(token);
  return { token, user };
}
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const [group, ...parts] = (await context.params).path;
    const operation = parts.join("/") as AuthOperation;
    if (group !== "auth") throw new ApiError(404, "Not found.");
    if (request.method === "GET") {
      if (parts.join("/") !== "me") throw new ApiError(404, "Not found.");
      return success((await requireAccount()).user);
    }
    if (request.headers.get("origin") !== (process.env.APP_ORIGIN || request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site")
      throw new ApiError(403, "Request origin is not allowed.");
    // Token-issuing operations must use NextAuth, never the generic gateway.
    if (!publicOperations.has(operation) && !privateOperations.has(operation)) throw new ApiError(404, "Not found.");
    if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415, "Expected a JSON request.");
    const raw = await request.text();
    if (raw.length > 65536) throw new ApiError(413, "Request is too large.");
    let input: unknown;
    try { input = JSON.parse(raw); } catch { throw new ApiError(400, "Invalid JSON."); }
    const parsed = contracts[operation].safeParse(input);
    if (!parsed.success) throw new ApiError(422, "Check the highlighted fields.", parsed.error.issues.map(issue => ({ field: String(issue.path[0]), message: issue.message })));
    if (privateOperations.has(operation)) {
      const { token } = await requireAccount();
      // An action's 401 can mean wrong password/code; do not invalidate the session.
      const data = await upstream(operation, parsed.data, token.tokens!.access_token);
      if (operation === "close-account") await clearAuthCookie();
      if (operation === "2fa/verify-method") await writeAuthToken({ ...token, user: data as User });
      return success(data);
    }
    if (operation === "2fa/setup") {
      const token = await readAuthToken();
      const pending = token?.pending;
      if (!token || !pending?.setup || pending.expiresAt <= Date.now()) throw new ApiError(401, "Verification expired. Please sign in again.");
      const result = await upstream<Setup>(operation, { ...parsed.data, pending_token: pending.token });
      if (!result.pending_token) throw new ApiError(502, "Incomplete setup response. Please sign in again.");
      await writeAuthToken({ ...token, pending: { token: result.pending_token, expiresAt: Date.now() + 300000, setup: true, method: result.method } });
      return success({ method: result.method, totp_secret: result.totp_secret, totp_otpauth_uri: result.totp_otpauth_uri });
    }
    const data = await upstream(operation, parsed.data);
    if (operation === "reset-password") await clearAuthCookie();
    return success(operation === "restore-account" ? null : data);
  } catch (error) {
    const known = error instanceof ApiError;
    return NextResponse.json({ success: false, message: known ? error.message : "Unable to complete the request.", errors: known ? error.errors : [] },
      { status: known ? error.status : 500, headers: { ...noStore, ...(known && error.retryAfter ? { "Retry-After": error.retryAfter } : {}) } });
  }
}
export { handle as GET, handle as POST };
