import { NextRequest, NextResponse } from "next/server";
import { requireApiAccount } from "../../_lib/account";
import { localeFromRequest } from "../../_lib/request-locale";
import { ApiError } from "../../_lib/upstream";
import { dictionaryFor } from "@/lib/i18n/config";

const noStore = { "Cache-Control": "no-store" };

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const locale = localeFromRequest(request);
  const dict = dictionaryFor(locale);
  try {
    const base = process.env.GARDE_API_URL;
    if (!base) throw new ApiError(503, dict.api.authServiceMissing);
    const { token } = await requireApiAccount(locale);
    const url = new URL(`${base.replace(/\/$/, "")}/notifications/ws`);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("token", token.tokens!.access_token);
    url.searchParams.set("lang", locale);
    return NextResponse.json({ success: true, data: { url: url.toString() } }, { headers: noStore });
  } catch (error) {
    const known = error instanceof ApiError;
    return NextResponse.json(
      { success: false, message: known ? error.message : dict.api.genericFailure, errors: known ? error.errors : [] },
      { status: known ? error.status : 500, headers: noStore },
    );
  }
}
