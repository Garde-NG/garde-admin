import type { Metadata } from "next";
import { CountriesPage } from "@/components/platform-setup/countries-page";

export const metadata: Metadata = { title: "Platform Setup" };

export default function Page() {
  return <CountriesPage />;
}
