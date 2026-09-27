import type { Metadata } from "next";
import { UserDetailPage } from "@/components/users/user-detail-page";

export const metadata: Metadata = { title: "User" };

export default async function Page({ params }: PageProps<"/[locale]/users/[id]">) {
  const { id } = await params;
  return <UserDetailPage id={id} />;
}
