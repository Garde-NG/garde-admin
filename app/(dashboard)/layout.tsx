import { cookies } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { AppShell } from "@/components/dashboard/app-shell";
import { NAVIGATION } from "@/lib/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { makeQueryClient } from "@/lib/query/query-client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const collapsed = (await cookies()).get("garde-sidebar")?.value === "collapsed";
  const client = makeQueryClient();
  client.setQueryData(["account", "me"], user);
  return <HydrationBoundary state={dehydrate(client)}><AppShell sections={NAVIGATION} defaultCollapsed={collapsed}>{children}</AppShell></HydrationBoundary>;
}
