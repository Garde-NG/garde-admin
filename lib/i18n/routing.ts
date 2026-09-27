import { defaultLocale, isLocale, type Locale } from "./config";

export function splitLocalePath(pathname: string): { locale: Locale | null; pathname: string } {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const parts = normalized.split("/");
  const maybeLocale = parts[1];
  if (!isLocale(maybeLocale)) return { locale: null, pathname: normalized };
  const rest = `/${parts.slice(2).join("/")}`.replace(/\/$/, "") || "/";
  return { locale: maybeLocale, pathname: rest };
}

export function localizedPath(path: string, locale: Locale = defaultLocale): string {
  const [pathname, query = ""] = path.split("?");
  const clean = splitLocalePath(pathname || "/").pathname;
  return `/${locale}${clean === "/" ? "" : clean}${query ? `?${query}` : ""}`;
}

export function replacePathLocale(pathname: string, locale: Locale): string {
  return localizedPath(splitLocalePath(pathname).pathname, locale);
}
