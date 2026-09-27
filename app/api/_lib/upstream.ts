export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: { field: string; message: string }[] = [],
    public retryAfter?: string,
  ) { super(message); }
}

/** Server-only transport. No tokens or upstream error bodies are logged. */
export async function upstream<T>(path: string, body?: unknown, accessToken?: string): Promise<T> {
  const base = process.env.GARDE_API_URL;
  if (!base) throw new ApiError(503, "The authentication service is not configured.");
  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, "")}/auth/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Accept-Language": "en",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(503, "Unable to reach the authentication service. Please try again.");
  }
  if (response.status === 204) return undefined as T;
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new ApiError(response.ok ? 502 : response.status,
      typeof result?.message === "string" ? result.message : "The authentication service could not complete this request.",
      Array.isArray(result?.errors) ? result.errors : [],
      response.headers.get("retry-after") ?? undefined);
  }
  return result.data as T;
}
