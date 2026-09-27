import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";

// Runs the production Next app against an isolated, contract-shaped upstream.
// Never sends credentials to the developer's real API.
test("admin authentication contract and session boundaries", { timeout: 120000 }, async (t) => {
  const user = { id: "test-admin", first_name: "Test", last_name: "Admin", email: "admin@example.com", phone_number: "+2348000000000", user_type: "admin", is_two_factor_enabled: true, two_factor_method: "email_otp", is_passwordless_enabled: false, created_at: "", updated_at: "" };
  let role = "admin", setup = false, expires = 7200, revoked = false, failLogout = false, failMe = false, unavailable = false, rateLimited = false;
  let refreshCount = 0, lastSetupToken = "", logoutCount = 0, tokenId = 0, largeTokens = false;
  const tokens = () => ({ access_token: "private-access-" + ++tokenId + (largeTokens ? "x".repeat(4500) : ""), refresh_token: "private-refresh-" + tokenId, expires_in: expires, user: { ...user, user_type: role } });
  const api = createServer(async (req, res) => {
    let text = ""; for await (const chunk of req) text += chunk;
    const body = text ? JSON.parse(text) : {};
    const path = req.url.replace("/api/v1/auth/", "");
    const ok = (data) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ success: true, data })); };
    const fail = (status, message) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ success: false, message, errors: null })); };
    if (path === "login") {
      if (rateLimited) { res.setHeader("Retry-After", "60"); return fail(429, "Too many requests, please try again later"); }
      return ok({ pending_token: "pending-original", two_factor_setup_required: setup, two_factor_method: setup ? null : "email_otp" });
    }
    if (path === "2fa/setup") {
      assert.equal(body.pending_token, "pending-original");
      return ok({ method: body.method, pending_token: "pending-rotated", totp_secret: "TESTSECRET", totp_otpauth_uri: "otpauth://totp/Test?secret=TESTSECRET" });
    }
    if (path === "2fa/verify-setup" || path === "2fa/verify-login") {
      lastSetupToken = body.pending_token;
      if (body.code !== "123456") return fail(401, "Invalid verification code");
      return ok(tokens());
    }
    if (path === "webauthn/login/verify") return ok(tokens());
    if (path === "me") {
      if (unavailable) return fail(503, "Temporarily unavailable");
      if (failMe) return fail(401, "Invalid token");
      assert.match(req.headers.authorization || "", /^Bearer private-access-/);
      return ok({ ...user, user_type: role });
    }
    if (path === "refresh") {
      refreshCount++;
      if (revoked) return fail(401, "Refresh token revoked");
      assert.match(body.refresh_token, /^private-refresh-/);
      await new Promise(resolve => setTimeout(resolve, 100));
      expires = 7200;
      failMe = false;
      return ok(tokens());
    }
    if (path === "logout") {
      logoutCount++;
      if (failLogout) return fail(503, "Service unavailable");
      res.statusCode = 204; return res.end();
    }
    if (path === "change-password") {
      if (body.current_password === "wrong") return fail(401, "Incorrect current password");
      res.statusCode = 204; return res.end();
    }
    if (["forgot-password", "reset-password", "close-account", "webauthn/register/verify"].includes(path)) { res.statusCode = 204; return res.end(); }
    if (path === "restore-account") return ok(user);
    if (path === "2fa/method") return ok({ method: body.method, totp_secret: null, totp_otpauth_uri: null });
    if (path === "2fa/verify-method") return ok({ ...user, two_factor_method: body.method });
    fail(404, "Not found");
  });
  await new Promise(resolve => api.listen(0, "127.0.0.1", resolve));
  const portProbe = createServer();
  await new Promise(resolve => portProbe.listen(0, "127.0.0.1", resolve));
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));
  const origin = "http://localhost:" + port;
  const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(port)], {
    cwd: process.cwd(), windowsHide: true,
    env: { ...process.env, NODE_ENV: "production", GARDE_API_URL: "http://127.0.0.1:" + api.address().port + "/api/v1", NEXTAUTH_SECRET: randomBytes(48).toString("hex"), APP_ORIGIN: origin, NEXTAUTH_URL: origin },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = ""; app.stdout.on("data", chunk => output += chunk); app.stderr.on("data", chunk => output += chunk);
  t.after(async () => { app.kill(); api.closeAllConnections(); await new Promise(resolve => api.close(resolve)); });
  for (let i = 0; i < 100; i++) {
    try { const ready = await fetch(origin + "/login"); if (ready.ok) break; } catch {}
    if (i === 99) throw new Error("Test app did not start: " + output);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  function client() {
    const jar = new Map();
    async function send(path, body, headers = {}, form = false) {
      const response = await fetch(origin + path, {
        method: body === undefined ? "GET" : "POST", redirect: "manual",
        headers: { Origin: origin, "Content-Type": form ? "application/x-www-form-urlencoded" : "application/json", Cookie: [...jar].map(([k, v]) => k + "=" + v).join("; "), ...headers },
        body: body === undefined ? undefined : form ? new URLSearchParams(body) : JSON.stringify(body),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const [pair] = cookie.split(";"); const index = pair.indexOf("=");
        const name = pair.slice(0, index), value = pair.slice(index + 1);
        if (!value || /max-age=0/i.test(cookie)) jar.delete(name);
        else jar.set(name, value);
      }
      return { status: response.status, json: await response.json().catch(() => null), headers: response.headers };
    }
    return {
      jar, send,
      hasSession: () => [...jar.keys()].some(key => key.startsWith("garde-next-auth")),
      proxy: (path, body, headers) => send("/api/proxy/auth/" + path, body, headers),
      session: () => send("/api/auth/session"),
      async signIn(credentials) {
        const csrf = await send("/api/auth/csrf");
        return send("/api/auth/callback/credentials", { ...credentials, csrfToken: csrf.json.csrfToken, callbackUrl: origin + "/dashboard", json: "true" }, {}, true);
      },
      async signOut() {
        const csrf = await send("/api/auth/csrf");
        return send("/api/auth/signout", { csrfToken: csrf.json.csrfToken, callbackUrl: origin + "/login", json: "true" }, {}, true);
      },
    };
  }
  const password = c => c.signIn({ mode: "password", email: user.email, password: "test-password" });
  async function login(c) {
    assert.equal((await password(c)).status, 200);
    return c.signIn({ mode: "verify", code: "123456" });
  }
  const c = client();
  await t.test("protects routes, proxy allowlist and CSRF boundaries", async () => {
    const page = await fetch(origin + "/dashboard", { redirect: "manual" });
    assert.equal(page.status, 307); assert.equal(page.headers.get("location"), "/login");
    assert.equal((await c.proxy("me")).status, 401);
    assert.equal((await c.proxy("forgot-password", {}, { Origin: "https://attacker.example" })).status, 403);
    assert.equal((await c.proxy("signup", {})).status, 404);
    assert.equal((await c.proxy("login", {})).status, 404);
    assert.equal((await c.proxy("forgot-password", { email: "invalid" })).status, 422);
    const untrusted = await c.send("/api/auth/callback/credentials", { mode: "password", email: user.email, password: "test-password", json: "true" }, {}, true);
    assert.ok(untrusted.status >= 300 || untrusted.json?.url?.includes("csrf=true"));
    assert.equal(c.hasSession(), false);
  });
  await t.test("NextAuth keeps pending/token secrets private and grants only completed sessions", async () => {
    assert.equal((await password(c)).status, 200);
    const pending = await c.session();
    assert.equal(pending.json.authStep, "two_factor");
    assert.equal(pending.json.challenge.method, "email_otp");
    assert.equal(JSON.stringify(pending.json).includes("pending-original"), false);
    assert.equal((await c.proxy("me")).status, 401);
    assert.equal((await c.signIn({ mode: "verify", code: "000000" })).status, 401);
    const verified = await c.signIn({ mode: "verify", code: "123456" });
    assert.equal(verified.status, 200);
    assert.match(verified.headers.getSetCookie().join(";"), /HttpOnly/i);
    assert.match(verified.headers.getSetCookie().join(";"), /Secure/i);
    const session = await c.session();
    assert.equal(session.json.user.user_type, "admin");
    assert.equal(session.json.authStep, "authenticated");
    assert.equal(JSON.stringify(session.json).includes("private-"), false);
    assert.equal((await c.proxy("me")).status, 200);
  });
  await t.test("incorrect security password does not refresh or end the session", async () => {
    const before = refreshCount;
    assert.equal((await c.proxy("change-password", { current_password: "wrong", new_password: "new-password" })).status, 401);
    assert.equal(refreshCount, before);
    assert.equal((await c.proxy("me")).status, 200);
  });
  await t.test("rate-limit message survives NextAuth and API outages retain session", async () => {
    rateLimited = true;
    const limited = await password(client());
    assert.equal(limited.status, 401);
    assert.match(decodeURIComponent(limited.json.url), /Too many requests/);
    rateLimited = false; unavailable = true;
    assert.equal((await c.proxy("me")).status, 503);
    assert.equal(c.hasSession(), true); unavailable = false;
    assert.equal((await c.proxy("me")).status, 200);
  });
  await t.test("rejected access tokens refresh before profile retry", async () => {
    const before = refreshCount; failMe = true;
    assert.equal((await c.proxy("me")).status, 200);
    assert.equal(refreshCount, before + 1);
  });
  await t.test("setup proxy rotates pending token used by NextAuth verification", async () => {
    setup = true; const fresh = client();
    await password(fresh);
    const started = await fresh.proxy("2fa/setup", { method: "totp", pending_token: "attacker-token" });
    assert.equal(started.status, 200);
    assert.equal(started.json.data.pending_token, undefined);
    assert.equal((await fresh.signIn({ mode: "verify", code: "123456" })).status, 200);
    assert.equal(lastSetupToken, "pending-rotated"); setup = false;
  });
  await t.test("customer login and passkey tokens cannot create admin sessions", async () => {
    role = "customer"; const before = logoutCount;
    const customer = client();
    const rejected = await login(customer);
    assert.equal(rejected.status, 401);
    assert.match(decodeURIComponent(rejected.json.url), /restricted to administrators/);
    assert.equal((await customer.proxy("me")).status, 401);
    assert.equal((await client().signIn({ mode: "passkey", email: user.email, credential: "{}" })).status, 401);
    assert.equal(logoutCount, before + 2); role = "admin";
  });
  await t.test("concurrent proxy requests redeem rotating tokens once", async () => {
    expires = 0; const fresh = client(); await login(fresh);
    const before = refreshCount;
    const results = await Promise.all([fresh.proxy("me"), fresh.proxy("me")]);
    assert.deepEqual(results.map(r => r.status), [200, 200]);
    assert.equal(refreshCount, before + 1);
  });
  await t.test("NextAuth session endpoint refreshes without exposing tokens", async () => {
    expires = 0; const fresh = client(); await login(fresh);
    const before = refreshCount;
    const result = await fresh.session();
    assert.equal(result.json.authStep, "authenticated");
    assert.equal(result.json.authError, undefined);
    assert.equal(refreshCount, before + 1);
    assert.equal(JSON.stringify(result.json).includes("private-"), false);
  });
  await t.test("NextAuth and the proxy share refresh coordination", async () => {
    expires = 0; const fresh = client(); await login(fresh);
    const before = refreshCount;
    const results = await Promise.all([fresh.session(), fresh.proxy("me")]);
    assert.deepEqual(results.map(r => r.status), [200, 200]);
    assert.equal(refreshCount, before + 1);
  });
  await t.test("chunked NextAuth cookies survive proxy writes and logout", async () => {
    largeTokens = true; const fresh = client(); await login(fresh);
    assert.ok([...fresh.jar.keys()].some(name => name === "garde-next-auth.0"));
    assert.equal((await fresh.proxy("me")).status, 200);
    assert.equal((await fresh.session()).json.authStep, "authenticated");
    await fresh.signOut();
    assert.equal(fresh.hasSession(), false); largeTokens = false;
  });
  await t.test("revoked refresh removes the usable session", async () => {
    expires = 0; const fresh = client(); await login(fresh); revoked = true;
    assert.equal((await fresh.proxy("me")).status, 401);
    assert.equal(fresh.hasSession(), false); revoked = false; expires = 7200;
  });
  await t.test("security/recovery proxies handle 204s and reset clears NextAuth cookie", async () => {
    assert.equal((await c.proxy("forgot-password", { email: user.email })).status, 200);
    assert.equal((await c.proxy("2fa/method", { method: "totp" })).status, 200);
    assert.equal((await c.proxy("2fa/verify-method", { method: "totp", code: "123456" })).status, 200);
    assert.equal((await c.proxy("reset-password", { email: user.email, otp: "123456", new_password: "new-password" })).status, 200);
    assert.equal(c.hasSession(), false);
    assert.equal((await c.proxy("restore-account", { email: user.email, password: "test-password" })).status, 200);
    assert.equal((await c.proxy("me")).status, 401);
  });
  await t.test("NextAuth sign-out clears cookie despite upstream logout failure", async () => {
    await login(c); failLogout = true;
    assert.equal((await c.signOut()).status, 200);
    assert.equal(c.hasSession(), false); failLogout = false;
  });
  await t.test("account closure clears the NextAuth session", async () => {
    await login(c);
    assert.equal((await c.proxy("close-account", { password: "test-password" })).status, 200);
    assert.equal(c.hasSession(), false);
  });
});
