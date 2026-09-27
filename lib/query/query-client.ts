import { QueryClient, isServer } from "@tanstack/react-query";
import { AuthError } from "@/lib/auth/client";
export function makeQueryClient() {
  return new QueryClient({ defaultOptions: {
    queries: { staleTime: 60000, gcTime: 600000, refetchOnWindowFocus: true,
      retry: (count, error) => error instanceof AuthError && (error.status === 0 || error.status >= 500) && count < 2 },
    mutations: { retry: false },
  } });
}
let browserClient: QueryClient | undefined;
export function getQueryClient() {
  return isServer ? makeQueryClient() : (browserClient ??= makeQueryClient());
}
