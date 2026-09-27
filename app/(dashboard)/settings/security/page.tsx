import { PageHeader } from "@/components/dashboard/page-header";
import { SecuritySettings } from "@/components/settings/security-settings";
export const metadata = { title: "Security" };
export default function SecurityPage() {
  return <div className="max-w-2xl"><PageHeader title="Security" description="Manage how you sign in to your account." /><SecuritySettings /></div>;
}
