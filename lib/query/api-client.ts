"use client";

import { currentLocale } from "@/lib/auth/client";
import { dictionaryFor } from "@/lib/i18n/config";

/** Shared fetch wrapper for feature clients that talk to `/api/<feature>` route handlers. */
export function createApiRequest(basePath: string) {
  return async function apiRequest<T>(path = "", init?: RequestInit): Promise<T> {
    const locale = currentLocale();
    const response = await fetch(`${basePath}${path}`, {
      ...init,
      headers: {
        "Accept-Language": locale,
        "X-Garde-Locale": locale,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
    if (response.status === 204) return undefined as T;
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) throw new Error(result?.message || dictionaryFor(locale).api.genericFailure);
    return result.data as T;
  };
}
