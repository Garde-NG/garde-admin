import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
export const metadata = { title: "Security" };
export default function SecurityPage() {
  return <div className="max-w-2xl"><PageHeader title="Security" description="Manage how you sign in to your account." /><div className="space-y-4">
    <p className="text-sm text-muted">Security settings will be available once your account is connected.</p>
    {[["Email verification", "Get a 6-digit code by email each time you sign in."], ["Authenticator app", "Use an authenticator app to generate sign-in codes."]].map(([title, description]) => <section key={title} className="rounded-xl border border-border bg-surface p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-sm text-muted">{description}</p><span className="mt-3 inline-block rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">Not connected</span></div><Button variant="secondary" disabled>Set up</Button></div></section>)}
  </div></div>;
}
