import type { Metadata } from "next";
import { CardsPage } from "@/components/cards/cards-page";

export const metadata: Metadata = { title: "Cards" };

export default function Page() {
  return <CardsPage />;
}
