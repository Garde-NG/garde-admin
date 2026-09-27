import type { Metadata } from "next";
import { LegalDocumentsPage } from "@/components/legal/legal-documents-page";

export const metadata: Metadata = { title: "Legal Documents" };

export default function Page() {
  return <LegalDocumentsPage />;
}
