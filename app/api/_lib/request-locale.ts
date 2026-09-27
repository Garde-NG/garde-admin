import type { NextRequest } from "next/server";
import { normalizeLocale, type Locale } from "@/lib/i18n/config";

export function localeFromRequest(request: NextRequest): Locale {
  return normalizeLocale(request.headers.get("x-garde-locale") ?? request.cookies.get("garde-locale")?.value ?? request.headers.get("accept-language"));
}
