import { redirect } from "next/navigation";
import { getLocalizedPath } from "@/lib/i18n/server";

export default async function ChangePasswordPage() {
  redirect(await getLocalizedPath("/settings/security"));
}
