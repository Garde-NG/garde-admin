import Image from "next/image";
import { BRAND } from "@/lib/brand";

export function LogoMark({ className = "size-9", inverse = false }: { className?: string; inverse?: boolean }) {
  return <Image unoptimized src={BRAND.collapsedLogoUrl} alt={BRAND.name} width={48} height={54} className={`shrink-0 object-contain ${inverse ? "" : "brightness-0 dark:brightness-100"} ${className}`} />;
}
export function Logo({ className = "", inverse = false }: { className?: string; inverse?: boolean }) {
  return <Image unoptimized src={BRAND.logoUrl} alt={BRAND.name} width={153} height={54} className={`h-9 w-auto shrink-0 object-contain ${inverse ? "" : "brightness-0 dark:brightness-100"} ${className}`} />;
}
