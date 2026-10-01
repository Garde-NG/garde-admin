const key = "garde-passkey-emails";
export function hasKnownPasskey(email: string) {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try { return (JSON.parse(localStorage.getItem(key) || "[]") as string[]).includes(email.trim().toLowerCase()); }
  catch { return false; }
}
export function rememberPasskey(email: string) {
  try {
    const emails = JSON.parse(localStorage.getItem(key) || "[]") as string[];
    localStorage.setItem(key, JSON.stringify([...new Set([...emails, email.trim().toLowerCase()])]));
    window.dispatchEvent(new Event("garde-passkeys"));
  } catch {}
}
const lastEmailKey = "garde-last-email";
export function getLastEmail() {
  try { return localStorage.getItem(lastEmailKey) || ""; } catch { return ""; }
}
export function rememberLastEmail(email: string) {
  try { localStorage.setItem(lastEmailKey, email.trim().toLowerCase()); } catch {}
}
export function subscribePasskey(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("garde-passkeys", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("garde-passkeys", callback); };
}
