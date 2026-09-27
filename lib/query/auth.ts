"use client";
import { useMutation } from "@tanstack/react-query";
import { signIn, getSession } from "next-auth/react";
import { authRequest } from "@/lib/auth/client";
/** All account writes use the same-origin API gateway, never the upstream URL. */
export function useAuthMutation<T = void>() {
  return useMutation({ mutationFn: ({ operation, body }: { operation: string; body: unknown }) => authRequest<T>(operation, body) });
}
export function useSignIn() {
  return useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const result = await signIn("credentials", { ...credentials, redirect: false });
      if (!result || result.error) throw new Error(result?.error || "Unable to sign in.");
      const session = await getSession();
      if (!session) throw new Error("Unable to load your session. Please sign in again.");
      return session;
    },
  });
}
