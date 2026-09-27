import { NextRequest, NextResponse } from "next/server";
import { requireApiAccount } from "../../_lib/account";
import { localeFromRequest } from "../../_lib/request-locale";
import { ApiError, upstreamRequest } from "../../_lib/upstream";
import type { NotificationItem } from "@/lib/notifications/types";
import { dictionaryFor } from "@/lib/i18n/config";

const noStore = { "Cache-Control": "no-store" };

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const locale = localeFromRequest(request);
  const dict = dictionaryFor(locale);
  try {
    const { id } = await context.params;
    const { token } = await requireApiAccount(locale);
    const data = await upstreamRequest<NotificationItem>("notifications", id, {
      accessToken: token.tokens!.access_token,
      locale,
    });
    return NextResponse.json({ success: true, data }, { headers: noStore });
  } catch (error) {
    const known = error instanceof ApiError;
    return NextResponse.json(
      { success: false, message: known ? error.message : dict.notifications.loadError, errors: known ? error.errors : [] },
      { status: known ? error.status : 500, headers: noStore },
    );
  }
}
