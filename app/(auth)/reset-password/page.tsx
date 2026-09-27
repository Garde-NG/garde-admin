import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthForm } from "@/components/auth/auth-form";
import { getServerDictionary } from "@/lib/i18n/server";
export const metadata = { title: "Reset password" };
export default async function ResetPasswordPage() {
  const dict = await getServerDictionary();
  return <AuthPanel title={dict.auth.resetPassword} description={dict.auth.resetPasswordDescription} footer={<Link href="/login" className="text-brand hover:underline">{dict.common.backToSignIn}</Link>}><AuthForm mode="reset" /></AuthPanel>;
}
