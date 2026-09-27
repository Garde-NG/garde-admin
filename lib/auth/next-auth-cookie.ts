import "server-only";
import { cookies } from "next/headers";
import { decode, encode } from "next-auth/jwt";
import { authSecret, SESSION_COOKIE, SESSION_MAX_AGE, sessionCookieOptions, type GardeToken } from "./next-auth-shared";

export async function readAuthToken(): Promise<GardeToken | null> {
  const store = await cookies();
  const chunks = store.getAll().filter(({ name }) => name.startsWith(SESSION_COOKIE + "."))
    .sort((a, b) => Number(a.name.split(".").pop()) - Number(b.name.split(".").pop()));
  const value = store.get(SESSION_COOKIE)?.value || chunks.map(c => c.value).join("");
  if (!value) return null;
  try { return await decode({ token: value, secret: authSecret() }) as GardeToken | null; }
  catch { return null; }
}
export async function clearAuthCookie() {
  const store = await cookies();
  for (const { name } of store.getAll()) {
    if (name === SESSION_COOKIE || name.startsWith(SESSION_COOKIE + ".") || name === "garde-session" || name.startsWith("garde-session."))
      store.set(name, "", { ...sessionCookieOptions, maxAge: 0 });
  }
}
export async function writeAuthToken(token: GardeToken) {
  const encoded = await encode({ token, secret: authSecret(), maxAge: SESSION_MAX_AGE });
  const store = await cookies();
  await clearAuthCookie();
  const chunks = encoded.match(/.{1,3800}/g) || [];
  chunks.forEach((value, index) => store.set(chunks.length === 1 ? SESSION_COOKIE : `${SESSION_COOKIE}.${index}`, value, { ...sessionCookieOptions, maxAge: SESSION_MAX_AGE }));
}
