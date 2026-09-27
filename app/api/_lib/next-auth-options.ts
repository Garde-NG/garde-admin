import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { randomUUID } from "node:crypto";
import { contracts } from "@/lib/auth/contracts";
import { readAuthToken } from "@/lib/auth/next-auth-cookie";
import { authSecret, SESSION_COOKIE, SESSION_MAX_AGE, sessionCookieOptions, type GardeToken } from "@/lib/auth/next-auth-shared";
import type { LoginChallenge, Tokens, User } from "@/lib/auth/types";
import { ApiError, upstream } from "./upstream";
import { refreshToken, shouldRefresh, tokenFromLogin } from "./token";
import { dictionaryFor, normalizeLocale } from "@/lib/i18n/config";

export const authOptions: NextAuthOptions = {
  secret: authSecret(),
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  cookies: { sessionToken: { name: SESSION_COOKIE, options: sessionCookieOptions } },
  pages: { signIn: "/login" },
  providers: [CredentialsProvider({
    name: "Garde API",
    credentials: { mode: {}, email: {}, password: {}, code: {}, credential: {}, locale: {} },
    async authorize(credentials) {
      const locale = normalizeLocale(credentials?.locale);
      const dict = dictionaryFor(locale);
      try {
        if (credentials?.mode === "password") {
          const body = contracts.login.parse(credentials);
          const result = await upstream<LoginChallenge>("login", body, undefined, locale);
          return { id: randomUUID(), authToken: {
            authStep: "two_factor",
            pending: { token: result.pending_token, expiresAt: Date.now() + 300000, setup: result.two_factor_setup_required, method: result.two_factor_method },
          } };
        }
        if (credentials?.mode === "verify") {
          const token = await readAuthToken();
          const pending = token?.pending;
          if (!pending || pending.expiresAt <= Date.now()) throw new ApiError(401, dict.api.verificationExpired);
          const { code } = contracts["2fa/verify-login"].parse(credentials);
          if (pending.setup && !pending.method) throw new ApiError(400, dict.api.chooseVerificationMethod);
          const result = await upstream<Tokens & { user: User }>(pending.setup ? "2fa/verify-setup" : "2fa/verify-login", {
            pending_token: pending.token, code, ...(pending.setup && { method: pending.method }),
          }, undefined, locale);
          return { id: result.user.id, authToken: await tokenFromLogin(result, locale) };
        }
        if (credentials?.mode === "passkey") {
          const body = contracts["webauthn/login/verify"].parse({ email: credentials.email, credential: JSON.parse(credentials.credential || "{}") });
          const result = await upstream<Tokens & { user: User }>("webauthn/login/verify", body, undefined, locale);
          return { id: result.user.id, authToken: await tokenFromLogin(result, locale) };
        }
        throw new ApiError(400, dict.api.unsupportedSignIn);
      } catch (error) {
        // Credentials errors are intentionally safe, readable API messages.
        throw new Error(error instanceof ApiError ? error.message : dict.api.signInDetails);
      }
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) return user.authToken;
      const current = token as GardeToken;
      return shouldRefresh(current) ? refreshToken(current) : current;
    },
    async session({ session, token }) {
      const current = token as GardeToken;
      session.authStep = current.authStep;
      session.authError = current.authError;
      session.user = current.authStep === "authenticated" ? current.user : undefined;
      session.challenge = current.pending && current.pending.expiresAt > Date.now()
        ? { setupRequired: current.pending.setup, method: current.pending.method } : undefined;
      // Access, refresh, and pending tokens never enter the public session response.
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      const current = token as GardeToken;
      if (current.tokens) await upstream("logout", { refresh_token: current.tokens.refresh_token }).catch(() => undefined);
    },
  },
};
