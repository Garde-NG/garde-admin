import { NextRequest, NextResponse } from "next/server";
import { requireApiAccount } from "../_lib/account";
import { localeFromRequest } from "../_lib/request-locale";
import { ApiError, upstreamRequest } from "../_lib/upstream";
import type { NotificationList } from "@/lib/notifications/types";
import { dictionaryFor } from "@/lib/i18n/config";

const noStore = { "Cache-Control": "no-store" };

export const runtime = "nodejs";

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

export async function GET(request: NextRequest) {
  const locale = localeFromRequest(request);
  const dict = dictionaryFor(locale);
  try {
    const { token } = await requireApiAccount(locale);
    const search = new URL(request.url).searchParams;
    if (!search.has("start_date")) search.set("start_date", today());
    if (!search.has("end_date")) search.set("end_date", search.get("start_date") ?? today());
    const data = await upstreamRequest<NotificationList>("notifications", "", {
      accessToken: token.tokens!.access_token,
      locale,
      search,
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
