import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { getServerDictionary } from "@/lib/i18n/server";
export const metadata = { title: "Profile" };
export default async function ProfilePage() {
  const dict = await getServerDictionary();
  return <div className="max-w-2xl"><PageHeader title={dict.pages.profile} description={dict.pages.accountDetails} /><div className="rounded-xl border border-border bg-surface p-5 sm:p-6"><ProfileForm /></div></div>;
}
