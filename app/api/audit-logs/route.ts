import { NextRequest } from "next/server";
import { requireApiAccount } from "../_lib/account";
import { localeFromRequest } from "../_lib/request-locale";
import { upstreamRequest } from "../_lib/upstream";
import { jsonError, jsonOk } from "../_lib/respond";
import type { AuditLogList } from "@/lib/audit/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const locale = localeFromRequest(request);
  try {
    const { token } = await requireApiAccount(locale);
    const search = new URL(request.url).searchParams;
    const data = await upstreamRequest<AuditLogList>("audit-logs", "", {
      accessToken: token.tokens!.access_token,
      locale,
      search,
    });
    return jsonOk(data);
  } catch (error) {
    return jsonError(error, locale, (dict) => dict.api.genericFailure);
  }
}
