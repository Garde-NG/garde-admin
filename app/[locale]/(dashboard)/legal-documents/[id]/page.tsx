import type { Metadata } from "next";
import { LegalDocumentDetailPage } from "@/components/legal/legal-document-detail-page";

export const metadata: Metadata = { title: "Legal Document" };

export default async function Page({ params }: PageProps<"/[locale]/legal-documents/[id]">) {
  const { id } = await params;
  return <LegalDocumentDetailPage id={id} />;
}
