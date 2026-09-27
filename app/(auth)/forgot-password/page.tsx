import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthForm } from "@/components/auth/auth-form";
import { getServerDictionary } from "@/lib/i18n/server";
export const metadata = { title: "Forgot password" };
export default async function ForgotPasswordPage() {
  const dict = await getServerDictionary();
  return <AuthPanel title={dict.auth.forgotPassword} description={dict.auth.forgotPasswordDescription} footer={<Link href="/login" className="text-brand hover:underline">{dict.common.backToSignIn}</Link>}><AuthForm mode="forgot" /></AuthPanel>;
}
