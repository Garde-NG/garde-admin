import type { Metadata } from "next";
import { ReconciliationPage } from "@/components/cards/reconciliation-page";

export const metadata: Metadata = { title: "Reconciliation" };

export default function Page() {
  return <ReconciliationPage />;
}
