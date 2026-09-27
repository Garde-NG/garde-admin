import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { getServerDictionary } from "@/lib/i18n/server";
export const metadata: Metadata = { title: "Dashboard" };
export default async function DashboardPage() {
  const dict = await getServerDictionary();
  return <PageHeader title={dict.pages.dashboard} />;
}
