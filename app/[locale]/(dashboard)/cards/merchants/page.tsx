import type { Metadata } from "next";
import { MerchantsPage } from "@/components/cards/merchants-page";

export const metadata: Metadata = { title: "Merchants" };

export default function Page() {
  return <MerchantsPage />;
}
