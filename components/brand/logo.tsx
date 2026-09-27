import Image from "next/image";
import { BRAND } from "@/lib/brand";

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return <Image unoptimized src={BRAND.collapsedLogoUrl} alt={BRAND.name} width={36} height={36} className={`shrink-0 object-contain ${className}`} />;
}
export function Logo({ className = "" }: { className?: string }) {
  return <Image unoptimized src={BRAND.logoUrl} alt={BRAND.name} width={140} height={36} className={`h-9 w-35 shrink-0 object-contain ${className}`} />;
}
