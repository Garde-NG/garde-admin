import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Forgot password" };
export default function ForgotPasswordPage() {
  return <AuthPanel title="Forgot password?" description="Enter your account email to request a password reset." footer={<Link href="/login" className="text-brand hover:underline">Back to sign in</Link>}><AuthForm mode="forgot" /></AuthPanel>;
}
