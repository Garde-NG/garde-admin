export class AuthError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) { super(message); }
}
export async function authRequest<T = void>(operation: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/proxy/auth/${operation}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AuthError(0, "Connection interrupted. Please try again.");
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) throw new AuthError(response.status,
    result?.message || "Unable to complete the request. Please try again.",
    Object.fromEntries((result?.errors ?? []).map((error: { field: string; message: string }) => [error.field, error.message])));
  return result.data as T;
}
export function messageOf(error: unknown) {
  if (error instanceof Error && error.name === "NotAllowedError") return "The passkey request was cancelled or timed out. Please try again.";
  return error instanceof Error ? error.message : "Unable to complete the request.";
}
