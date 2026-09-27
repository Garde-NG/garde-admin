import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthForm } from "@/components/auth/auth-form";
import { getServerDictionary } from "@/lib/i18n/server";
export const metadata = { title: "Restore account" };
export default async function RestorePage() {
  const dict = await getServerDictionary();
  return <AuthPanel title={dict.auth.restoreAccountTitle} description={dict.auth.restoreAccountDescription} footer={<Link href="/login" className="text-brand hover:underline">{dict.common.backToSignIn}</Link>}><AuthForm mode="restore" /></AuthPanel>;
}
