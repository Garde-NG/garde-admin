import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "Sign in" };
const notices: Record<string, string> = {
  expired: "Your session has ended. Please sign in again.",
  reset: "Password reset. Sign in with your new password.",
  restored: "Account restored. Sign in to continue.",
  closed: "Your account is closed. You can restore it within 7 days.",
  forbidden: "This platform is restricted to administrators.",
};
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { reason } = await searchParams;
  return <LoginForm notice={typeof reason === "string" ? notices[reason] : undefined} />;
}
