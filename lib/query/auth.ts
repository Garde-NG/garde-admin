"use client";
import { useMutation } from "@tanstack/react-query";
import { signIn, getSession } from "next-auth/react";
import { authRequest, currentLocale } from "@/lib/auth/client";
import { dictionaryFor } from "@/lib/i18n/config";
/** All account writes use the same-origin API gateway, never the upstream URL. */
export function useAuthMutation<T = void>() {
  return useMutation({ mutationFn: ({ operation, body }: { operation: string; body: unknown }) => authRequest<T>(operation, body) });
}
export function useSignIn() {
  return useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const locale = currentLocale();
      const dict = dictionaryFor(locale);
      const result = await signIn("credentials", { ...credentials, locale, redirect: false });
      if (!result || result.error) throw new Error(result?.error || dict.api.signInFailed);
      const session = await getSession();
      if (!session) throw new Error(dict.api.sessionLoadFailed);
      return session;
    },
  });
}
