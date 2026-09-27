import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Restore account" };
export default function RestorePage() {
  return <AuthPanel title="Restore your account" description="Closed accounts can be restored within 7 days." footer={<Link href="/login" className="text-brand hover:underline">Back to sign in</Link>}><AuthForm mode="restore" /></AuthPanel>;
}
