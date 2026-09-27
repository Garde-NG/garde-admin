import { cookies, headers } from "next/headers";
import { dictionaryFor, isLocale, LOCALE_COOKIE, normalizeLocale, type Locale } from "./config";

export async function getServerLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  return normalizeLocale((await headers()).get("accept-language"));
}

export async function getServerDictionary() {
  return dictionaryFor(await getServerLocale());
}
