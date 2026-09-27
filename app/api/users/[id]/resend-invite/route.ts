import { NextRequest } from "next/server";
import { requireApiAccount } from "../../../_lib/account";
import { localeFromRequest } from "../../../_lib/request-locale";
import { upstreamRequest } from "../../../_lib/upstream";
import { jsonError, noContent } from "../../../_lib/respond";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const locale = localeFromRequest(request);
  try {
    const { id } = await context.params;
    const { token } = await requireApiAccount(locale);
    await upstreamRequest("users", `${id}/resend-invite`, {
      accessToken: token.tokens!.access_token,
      locale,
      method: "POST",
    });
    return noContent();
  } catch (error) {
    return jsonError(error, locale, (dict) => dict.api.genericFailure);
  }
}
