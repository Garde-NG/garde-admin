import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Reset password" };
export default function ResetPasswordPage() {
  return <AuthPanel title="Reset password" description="Choose a new password for your account." footer={<Link href="/login" className="text-brand hover:underline">Back to sign in</Link>}><AuthForm mode="reset" /></AuthPanel>;
}
