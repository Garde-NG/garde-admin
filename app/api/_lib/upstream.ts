import { defaultLocale, dictionaryFor, type Locale } from "@/lib/i18n/config";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: { field: string; message: string }[] = [],
    public retryAfter?: string,
  ) { super(message); }
}

interface UpstreamOptions {
  body?: unknown;
  accessToken?: string;
  locale?: Locale;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  search?: URLSearchParams;
}

/** Server-only transport. No tokens or upstream error bodies are logged. */
export async function upstreamRequest<T>(resource: string, path = "", options: UpstreamOptions = {}): Promise<T> {
  const { body, accessToken, locale = defaultLocale, method, search } = options;
  const dict = dictionaryFor(locale);
  const base = process.env.GARDE_API_URL;
  if (!base) throw new ApiError(503, dict.api.authServiceMissing);
  const url = new URL(`${base.replace(/\/$/, "")}/${resource}${path ? `/${path.replace(/^\//, "")}` : ""}`);
  if (search) url.search = search.toString();
  let response: Response;
  try {
    response = await fetch(url, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: {
        "Accept-Language": locale,
        "X-Garde-Locale": locale,
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(503, dict.api.accountServiceUnavailable);
  }
  if (response.status === 204) return undefined as T;
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new ApiError(response.ok ? 502 : response.status,
      typeof result?.message === "string" ? result.message : dict.api.authServiceRequestFailed,
      Array.isArray(result?.errors) ? result.errors : [],
      response.headers.get("retry-after") ?? undefined);
  }
  return result.data as T;
}

export async function upstream<T>(path: string, body?: unknown, accessToken?: string, locale: Locale = defaultLocale): Promise<T> {
  return upstreamRequest<T>("auth", path, { body, accessToken, locale });
}
