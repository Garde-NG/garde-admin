"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query/query-client";
import { ToastProvider } from "@/components/ui/toast";
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchOnWindowFocus={false}><QueryClientProvider client={getQueryClient()}>
    <ToastProvider>{children}</ToastProvider>
    {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider></SessionProvider>;
}
