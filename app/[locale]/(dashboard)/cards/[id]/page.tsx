import type { Metadata } from "next";
import { CardDetailPage } from "@/components/cards/card-detail-page";

export const metadata: Metadata = { title: "Card" };

export default async function Page({ params }: PageProps<"/[locale]/cards/[id]">) {
  const { id } = await params;
  return <CardDetailPage id={id} />;
}
