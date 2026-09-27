import { NextRequest, NextResponse } from "next/server";
import { requireApiAccount } from "../../../_lib/account";
import { localeFromRequest } from "../../../_lib/request-locale";
import { ApiError, upstreamRequest } from "../../../_lib/upstream";
import type { NotificationItem } from "@/lib/notifications/types";
import { dictionaryFor } from "@/lib/i18n/config";

const noStore = { "Cache-Control": "no-store" };

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const locale = localeFromRequest(request);
  const dict = dictionaryFor(locale);
  try {
    const { id } = await context.params;
    const { token } = await requireApiAccount(locale);
    const data = await upstreamRequest<NotificationItem>("notifications", `${id}/read`, {
      accessToken: token.tokens!.access_token,
      locale,
      method: "POST",
    });
    return NextResponse.json({ success: true, data }, { headers: noStore });
  } catch (error) {
    const known = error instanceof ApiError;
    return NextResponse.json(
      { success: false, message: known ? error.message : dict.api.genericFailure, errors: known ? error.errors : [] },
      { status: known ? error.status : 500, headers: noStore },
    );
  }
}
