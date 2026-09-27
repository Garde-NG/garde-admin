"use client";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { authRequest } from "@/lib/auth/client";
import type { User } from "@/lib/auth/types";
export const userKey = ["account", "me"] as const;
export function useCurrentUser() {
  return useSuspenseQuery({
    queryKey: userKey,
    queryFn: async ({ signal }) => {
      try { return await authRequest<User>("me", undefined, signal); }
      catch (error) {
        const { AuthError } = await import("@/lib/auth/client");
        if (error instanceof AuthError && [401, 403].includes(error.status)) window.location.replace("/login?reason=expired");
        throw error;
      }
    },
    staleTime: 0, refetchInterval: 45000,
  }).data;
}
export function useUser() {
  const client = useQueryClient();
  const user = useCurrentUser();
  return { user, refreshUser: () => client.invalidateQueries({ queryKey: userKey }) };
}
