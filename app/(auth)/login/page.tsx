import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "Sign in" };
export default function LoginPage() {
  return <AuthPanel title="Welcome back" description="Sign in to your staff account to continue."><AuthForm mode="login" /></AuthPanel>;
}
