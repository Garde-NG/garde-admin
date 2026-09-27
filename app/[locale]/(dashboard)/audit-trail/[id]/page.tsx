import type { Metadata } from "next";
import { AuditLogDetailPage } from "@/components/audit/audit-log-detail-page";

export const metadata: Metadata = { title: "Audit Log Entry" };

export default async function Page({ params }: PageProps<"/[locale]/audit-trail/[id]">) {
  const { id } = await params;
  return <AuditLogDetailPage id={id} />;
}
