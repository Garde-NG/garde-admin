import { NextRequest } from "next/server";
import { dictionaryFor } from "@/lib/i18n/config";
import { requireApiAccount } from "../../_lib/account";
import { localeFromRequest } from "../../_lib/request-locale";
import { ApiError, upstreamRequest } from "../../_lib/upstream";
import { jsonError, jsonOk } from "../../_lib/respond";

export const runtime = "nodejs";

type Method = "GET" | "POST" | "PATCH";

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const SCHEME = "(?:verve|afrigo|visa|mastercard)";
const SLUG = "[a-z0-9_]{2,40}";

/**
 * Only the documented virtual-card admin endpoints are reachable through this gateway.
 * The path after /api/card-ops is forwarded verbatim to the API (`/api/v1/<path>`).
 */
const ROUTES: { method: Method; pattern: RegExp; status?: number }[] = [
  { method: "GET", pattern: /^card-schemes$/ },
  { method: "POST", pattern: new RegExp(`^card-schemes/${SCHEME}/(?:disable|enable)$`) },
  { method: "GET", pattern: /^admin\/cards$/ },
  { method: "GET", pattern: new RegExp(`^admin/cards/${UUID}$`) },
  { method: "POST", pattern: new RegExp(`^admin/cards/${UUID}/(?:freeze|unfreeze)$`) },
  { method: "GET", pattern: /^admin\/card-activity$/ },
  { method: "GET", pattern: /^admin\/card-stats$/ },
  { method: "GET", pattern: /^merchants$/ },
  { method: "POST", pattern: /^merchants$/, status: 201 },
  { method: "PATCH", pattern: new RegExp(`^merchants/${SLUG}$`) },
  { method: "GET", pattern: /^admin\/merchants\/observed$/ },
  { method: "POST", pattern: /^admin\/reconciliation\/run$/, status: 202 },
  { method: "GET", pattern: /^admin\/reconciliation\/issues$/ },
  { method: "POST", pattern: new RegExp(`^admin/reconciliation/issues/${UUID}/resolve$`) },
  { method: "GET", pattern: /^admin\/wallet-sync\/jobs$/ },
  { method: "POST", pattern: /^admin\/wallet-sync\/run$/, status: 202 },
  { method: "GET", pattern: new RegExp(`^admin/wallet-sync/cards/${UUID}$`) },
];

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const locale = localeFromRequest(request);
  const dict = dictionaryFor(locale);
  try {
    const method = request.method as Method;
    const path = (await context.params).path.join("/");
    const route = ROUTES.find((entry) => entry.method === method && entry.pattern.test(path));
    if (!route) throw new ApiError(404, dict.api.notFound);

    let body: unknown;
    if (method !== "GET") {
      if (request.headers.get("origin") !== (process.env.APP_ORIGIN || request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site")
        throw new ApiError(403, dict.api.originNotAllowed);
      const raw = await request.text();
      if (raw.length > 65536) throw new ApiError(413, dict.api.requestTooLarge);
      if (raw) {
        try { body = JSON.parse(raw); } catch { throw new ApiError(400, dict.api.invalidJson); }
      } else {
        body = {};
      }
    }

    const { token } = await requireApiAccount(locale);
    const data = await upstreamRequest<unknown>(path, "", {
      accessToken: token.tokens!.access_token,
      locale,
      method,
      body,
      search: method === "GET" ? new URL(request.url).searchParams : undefined,
    });
    return jsonOk(data ?? null, route.status ?? 200);
  } catch (error) {
    return jsonError(error, locale, (d) => d.api.genericFailure);
  }
}

export { handle as GET, handle as POST, handle as PATCH };
