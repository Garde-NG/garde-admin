import { defaultLocale, dictionaryFor, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";

export class AuthError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) { super(message); }
}
export function currentLocale(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const value = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  const decoded = value ? decodeURIComponent(value) : undefined;
  if (isLocale(decoded)) return decoded;
  return isLocale(document.documentElement.lang) ? document.documentElement.lang : defaultLocale;
}
export async function authRequest<T = void>(operation: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const locale = currentLocale();
  const dict = dictionaryFor(locale);
  let response: Response;
  try {
    response = await fetch(`/api/proxy/auth/${operation}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Accept-Language": locale,
        "X-Garde-Locale": locale,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AuthError(0, dict.api.connectionInterrupted);
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) throw new AuthError(response.status,
    result?.message || dict.api.genericFailure,
    Object.fromEntries((result?.errors ?? []).map((error: { field: string; message: string }) => [error.field, error.message])));
  return result.data as T;
}
export function messageOf(error: unknown) {
  const dict = dictionaryFor(currentLocale());
  if (error instanceof Error && error.name === "NotAllowedError") return dict.api.passkeyCancelled;
  return error instanceof Error ? error.message : dict.api.genericFailure;
}
