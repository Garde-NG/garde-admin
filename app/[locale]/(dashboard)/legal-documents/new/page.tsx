import type { Metadata } from "next";
import { LegalDocumentCreatePage } from "@/components/legal/legal-document-create-page";

export const metadata: Metadata = { title: "New Legal Document" };

export default function Page() {
  return <LegalDocumentCreatePage />;
}
