import { NextRequest, NextResponse } from "next/server";
import { requireApiAccount } from "../../_lib/account";
import { localeFromRequest } from "../../_lib/request-locale";
import { ApiError, upstreamRequest } from "../../_lib/upstream";
import { dictionaryFor } from "@/lib/i18n/config";

const noStore = { "Cache-Control": "no-store" };

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const locale = localeFromRequest(request);
  const dict = dictionaryFor(locale);
  try {
    const { token } = await requireApiAccount(locale);
    await upstreamRequest("notifications", "read-all", {
      accessToken: token.tokens!.access_token,
      locale,
      method: "POST",
    });
    return new NextResponse(null, { status: 204, headers: noStore });
  } catch (error) {
    const known = error instanceof ApiError;
    return NextResponse.json(
      { success: false, message: known ? error.message : dict.api.genericFailure, errors: known ? error.errors : [] },
      { status: known ? error.status : 500, headers: noStore },
    );
  }
}
