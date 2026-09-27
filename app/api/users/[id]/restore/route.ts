import { NextRequest } from "next/server";
import { requireApiAccount } from "../../../_lib/account";
import { localeFromRequest } from "../../../_lib/request-locale";
import { upstreamRequest } from "../../../_lib/upstream";
import { jsonError, jsonOk } from "../../../_lib/respond";
import type { AdminUser } from "@/lib/users/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const locale = localeFromRequest(request);
  try {
    const { id } = await context.params;
    const { token } = await requireApiAccount(locale);
    const data = await upstreamRequest<AdminUser>("users", `${id}/restore`, {
      accessToken: token.tokens!.access_token,
      locale,
      method: "POST",
    });
    return jsonOk(data);
  } catch (error) {
    return jsonError(error, locale, (dict) => dict.api.genericFailure);
  }
}
