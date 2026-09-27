import { PageHeader } from "@/components/dashboard/page-header";
import { SecuritySettings } from "@/components/settings/security-settings";
import { getServerDictionary } from "@/lib/i18n/server";
export const metadata = { title: "Security" };
export default async function SecurityPage() {
  const dict = await getServerDictionary();
  return <div className="max-w-2xl"><PageHeader title={dict.pages.security} description={dict.pages.manageSignIn} /><SecuritySettings /></div>;
}
