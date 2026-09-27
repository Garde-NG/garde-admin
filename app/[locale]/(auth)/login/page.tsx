import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { getServerDictionary } from "@/lib/i18n/server";
export const metadata: Metadata = { title: "Sign in" };
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const dict = await getServerDictionary();
  const notices: Record<string, string> = {
    expired: dict.auth.sessionExpiredNotice,
    reset: dict.auth.resetNotice,
    restored: dict.auth.restoredNotice,
    closed: dict.auth.closedNotice,
    forbidden: dict.auth.forbiddenNotice,
  };
  const { reason } = await searchParams;
  return <LoginForm notice={typeof reason === "string" ? notices[reason] : undefined} />;
}
