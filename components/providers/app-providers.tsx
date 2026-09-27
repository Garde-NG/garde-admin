"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query/query-client";
import { ToastProvider } from "@/components/ui/toast";
import { LanguageProvider } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/config";
export function AppProviders({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  return <LanguageProvider initialLocale={initialLocale}><SessionProvider refetchOnWindowFocus={false}><QueryClientProvider client={getQueryClient()}>
    <ToastProvider>{children}</ToastProvider>
    {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider></SessionProvider></LanguageProvider>;
}
