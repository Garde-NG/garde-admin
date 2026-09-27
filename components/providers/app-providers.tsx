"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query/query-client";
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchOnWindowFocus={false}><QueryClientProvider client={getQueryClient()}>
    {children}
    {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider></SessionProvider>;
}
