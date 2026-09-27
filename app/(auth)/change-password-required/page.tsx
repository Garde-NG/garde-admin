import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Change password" };
export default function ChangePasswordPage() {
  return <AuthPanel title="Change your password" description="Set a new password to secure your account." footer={<Link href="/login" className="text-brand hover:underline">Back to sign in</Link>}><AuthForm mode="change" /></AuthPanel>;
}
