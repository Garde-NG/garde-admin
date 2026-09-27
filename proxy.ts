import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;
const RESERVED_PREFIXES = ["/api", "/_next"];

function pathnameLocale(pathname: string) {
  const [, maybeLocale] = pathname.split("/");
  return isLocale(maybeLocale) ? maybeLocale : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (RESERVED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const locale = pathnameLocale(pathname);
  if (locale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-garde-locale", locale);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: 31536000 });
    return response;
  }

  const nextLocale = normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value ?? request.headers.get("accept-language")) || defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${nextLocale}${pathname === "/" ? "/login" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
