import { cookies } from "next/headers";
import { AppShell } from "@/components/dashboard/app-shell";
import { NAVIGATION } from "@/lib/navigation";

// Presentation-only preview. Add server-side session verification with the auth API.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const collapsed = (await cookies()).get("garde-sidebar")?.value === "collapsed";
  return <AppShell sections={NAVIGATION} defaultCollapsed={collapsed}>{children}</AppShell>;
}
