import type { Metadata } from "next";
import { CardOverview } from "@/components/cards/card-overview";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <CardOverview />;
}
