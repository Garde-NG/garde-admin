import type { Metadata } from "next";
import { CardSchemesPage } from "@/components/cards/card-schemes-page";

export const metadata: Metadata = { title: "Card schemes" };

export default function Page() {
  return <CardSchemesPage />;
}
