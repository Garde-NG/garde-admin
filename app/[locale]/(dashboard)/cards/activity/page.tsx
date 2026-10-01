import type { Metadata } from "next";
import { CardActivityPage } from "@/components/cards/card-activity-page";

export const metadata: Metadata = { title: "Payment activity" };

export default function Page() {
  return <CardActivityPage />;
}
