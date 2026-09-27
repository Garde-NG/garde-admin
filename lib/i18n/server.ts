import { cookies, headers } from "next/headers";
import { dictionaryFor, isLocale, LOCALE_COOKIE, normalizeLocale, type Locale } from "./config";
import { localizedPath } from "./routing";

export async function getServerLocale(): Promise<Locale> {
  const headerLocale = (await headers()).get("x-garde-locale");
  if (isLocale(headerLocale)) return headerLocale;
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  return normalizeLocale((await headers()).get("accept-language"));
}

export async function getServerDictionary() {
  return dictionaryFor(await getServerLocale());
}

export async function getLocalizedPath(path: string) {
  return localizedPath(path, await getServerLocale());
}
