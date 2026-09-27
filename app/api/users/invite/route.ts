import { NextRequest } from "next/server";
import { requireApiAccount } from "../../_lib/account";
import { localeFromRequest } from "../../_lib/request-locale";
import { upstreamRequest } from "../../_lib/upstream";
import { jsonError, jsonOk } from "../../_lib/respond";
import type { AdminUser, InviteAdminInput } from "@/lib/users/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const locale = localeFromRequest(request);
  try {
    const { token } = await requireApiAccount(locale);
    const body = (await request.json()) as InviteAdminInput;
    const data = await upstreamRequest<AdminUser>("users", "invite", {
      accessToken: token.tokens!.access_token,
      locale,
      method: "POST",
      body,
    });
    return jsonOk(data, 201);
  } catch (error) {
    return jsonError(error, locale, (dict) => dict.api.genericFailure);
  }
}
