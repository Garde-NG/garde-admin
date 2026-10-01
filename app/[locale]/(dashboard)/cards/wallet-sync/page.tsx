import type { Metadata } from "next";
import { WalletSyncPage } from "@/components/cards/wallet-sync-page";

export const metadata: Metadata = { title: "Wallet sync" };

export default function Page() {
  return <WalletSyncPage />;
}
