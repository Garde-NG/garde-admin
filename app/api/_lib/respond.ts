import { NextResponse } from "next/server";
import { dictionaryFor, type Locale, type Dictionary } from "@/lib/i18n/config";
import { ApiError } from "./upstream";

export const noStore = { "Cache-Control": "no-store" };

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status, headers: noStore });
}

export function noContent() {
  return new NextResponse(null, { status: 204, headers: noStore });
}

export function jsonError(error: unknown, locale: Locale, fallback: (dict: Dictionary) => string) {
  const dict = dictionaryFor(locale);
  const known = error instanceof ApiError;
  return NextResponse.json(
    { success: false, message: known ? error.message : fallback(dict), errors: known ? error.errors : [] },
    { status: known ? error.status : 500, headers: noStore },
  );
}
