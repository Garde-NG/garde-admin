"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/dashboard/screen-kit";
import { useI18n } from "@/lib/i18n/provider";
import { FREEZE_SOURCE_LABEL, SCHEME_META, formatMoney, reasonLabel, schemeName } from "@/lib/cards/format";
import type { AdminCard, CardScheme, CardStatus, FreezeSource } from "@/lib/cards/types";

/* ---------- Identity ---------- */

const SCHEME_DOT: Record<CardScheme, string> = {
  verve: "bg-[#11785a] dark:bg-[#2fcf97]",
  afrigo: "bg-[#b07b0c] dark:bg-[#f2b740]",
  visa: "bg-[#2840a8] dark:bg-[#7b93f2]",
  mastercard: "bg-[#c2410c] dark:bg-[#fb8a5c]",
};

/** Scheme name with a small identifying dot. The text carries the meaning; the dot only aids scanning. */
export function SchemeChip({ scheme, className = "" }: { scheme: string | null | undefined; className?: string }) {
  if (!scheme) return <span className="text-sm text-muted">—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${SCHEME_DOT[scheme as CardScheme] ?? "bg-muted"}`} />
      {schemeName(scheme)}
    </span>
  );
}

export function CardStatusBadge({ status, freezeSource }: { status: CardStatus; freezeSource?: FreezeSource | null }) {
  const { t } = useI18n();
  if (status === "active") return <Badge tone="success">{t("cards.statusActive")}</Badge>;
  if (status === "terminated") return <Badge tone="neutral">{t("cards.statusTerminated")}</Badge>;
  return (
    <Badge tone={freezeSource === "user" ? "brand" : "warning"} className="gap-1">
      <Icon name="snowflake" className="size-3" />
      {t("cards.statusFrozen")}
      {freezeSource && <span className="font-normal opacity-80">· {t(FREEZE_SOURCE_LABEL[freezeSource])}</span>}
    </Badge>
  );
}

export function OutcomeBadge({ approved, reason }: { approved: boolean; reason?: string }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex min-w-0 flex-col items-start gap-0.5">
      <Badge tone={approved ? "success" : "danger"} className="gap-1">
        <Icon name={approved ? "check" : "x"} className="size-3" />
        {approved ? t("cardActivity.approved") : t("cardActivity.declined")}
      </Badge>
      {reason && !approved && <span className="max-w-full truncate text-xs text-muted">{reasonLabel(reason, t)}</span>}
    </span>
  );
}

export function MaskedNumber({ last4, className = "" }: { last4: string | null; className?: string }) {
  return <span className={`font-mono tabular-nums tracking-wider ${className}`}>•••• {last4 ?? "····"}</span>;
}

/** A small illustration of the card itself, so admins recognise it at a glance. */
export function CardFace({ card, size = "md" }: { card: Pick<AdminCard, "label" | "scheme" | "currency" | "last4" | "status" | "user_name">; size?: "sm" | "md" }) {
  const meta = SCHEME_META[card.scheme];
  const muted = card.status !== "active";
  if (size === "sm") {
    return (
      <span aria-hidden className={`relative flex h-9 w-14 shrink-0 flex-col justify-between overflow-hidden rounded-md bg-gradient-to-br p-1.5 text-white shadow-sm ${meta?.face ?? "from-zinc-700 to-zinc-900"} ${muted ? "opacity-55 grayscale-[0.6]" : ""}`}>
        <span className="block h-1.5 w-2.5 rounded-[2px] bg-white/60" />
        <span className="font-mono text-[9px] leading-none tracking-wider">{card.last4 ?? "····"}</span>
        {card.status === "frozen" && <Icon name="snowflake" className="absolute right-1 top-1 size-3" />}
      </span>
    );
  }
  return (
    <div className={`relative aspect-[1.586] w-full max-w-[22rem] overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-card ${meta?.face ?? "from-zinc-700 to-zinc-900"} ${muted ? "grayscale-[0.5]" : ""}`}>
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-14 size-48 rounded-full bg-white/10 blur-xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-black/20 blur-2xl" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-white/90">{card.label}</p>
          <span className="shrink-0 rounded-md bg-white/15 px-1.5 py-0.5 text-xs font-semibold backdrop-blur">{card.currency}</span>
        </div>
        <div aria-hidden className="h-7 w-10 rounded-md bg-gradient-to-br from-amber-100/90 to-amber-300/80 shadow-inner" />
        <div className="space-y-2">
          <MaskedNumber last4={card.last4} className="text-lg text-white" />
          <div className="flex items-end justify-between gap-3">
            <p className="min-w-0 truncate text-xs uppercase tracking-wide text-white/75">{card.user_name}</p>
            <p className="shrink-0 text-base font-semibold italic tracking-tight">{meta?.name ?? card.scheme}</p>
          </div>
        </div>
      </div>
      {card.status === "frozen" && (
        <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-sky-100/10 backdrop-blur-[1px]">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <Icon name="snowflake" className="size-6" />
          </span>
        </span>
      )}
    </div>
  );
}

export function Money({ amount, currency, className = "" }: { amount: number; currency: string | null | undefined; className?: string }) {
  const { locale } = useI18n();
  return <span className={`tabular-nums ${className}`}>{formatMoney(amount, currency, locale)}</span>;
}

/* ---------- Layout ---------- */

export function Panel({ title, icon, actions, children, footer, className = "", bodyClassName = "" }: { title: ReactNode; icon?: IconName; actions?: ReactNode; children: ReactNode; footer?: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-card ${className}`}>
      <header className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {icon && <Icon name={icon} className="size-4 text-muted" />}
          {title}
        </h2>
        {actions}
      </header>
      <div className={bodyClassName}>{children}</div>
      {footer && <footer className="border-t border-border px-4 py-3 text-xs text-muted sm:px-5">{footer}</footer>}
    </section>
  );
}

export function DetailRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-sm font-medium sm:text-right">{children}</dd>
    </div>
  );
}

export function CopyValue({ value, display = value, mono = false }: { value: string; display?: string; mono?: boolean }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1">
      <span title={value} className={`min-w-0 truncate ${mono ? "font-mono text-xs" : ""}`}>{display}</span>
      <button
        type="button"
        title={copied ? t("cards.copied") : t("common.copy")}
        aria-label={copied ? t("cards.copied") : t("common.copy")}
        onClick={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          } catch {}
        }}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-subtle hover:text-foreground"
      >
        <Icon name={copied ? "check" : "copy"} className={`size-3.5 ${copied ? "text-success" : ""}`} />
      </button>
    </span>
  );
}

/** An applied filter that came from a link (e.g. "this customer's cards"), removable in one click. */
export function FilterChip({ label, value, onClear }: { label: string; value: ReactNode; onClear: () => void }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft pl-3 pr-1 text-xs text-brand">
      <span className="shrink-0 font-medium">{label}:</span>
      <span className="min-w-0 truncate">{value}</span>
      <button type="button" onClick={onClear} aria-label={`${t("cards.clearFilter")} ${label}`} className="flex size-6 shrink-0 items-center justify-center rounded-full transition hover:bg-brand/15">
        <Icon name="x" className="size-3.5" />
      </button>
    </span>
  );
}

export function StatTile({ label, value, sub, icon, tone = "default", href, loading }: { label: string; value: ReactNode; sub?: ReactNode; icon?: IconName; tone?: "default" | "danger" | "warning" | "success"; href?: string; loading?: boolean }) {
  const { href: localized } = useI18n();
  const toneRing = tone === "danger" ? "border-danger/40" : tone === "warning" ? "border-warning/40" : "border-border";
  const iconTone = tone === "danger" ? "bg-danger-soft text-danger" : tone === "warning" ? "bg-warning-soft text-warning" : tone === "success" ? "bg-success-soft text-success" : "bg-brand-soft text-brand";
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {icon && (
          <span aria-hidden className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
            <Icon name={icon} className="size-4" />
          </span>
        )}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
        {loading ? <span aria-hidden className="inline-block h-7 w-20 animate-pulse rounded bg-subtle align-middle" /> : value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </>
  );
  const className = `block min-w-0 rounded-2xl border bg-surface p-4 shadow-card sm:p-5 ${toneRing}`;
  if (href) {
    return (
      <Link href={localized(href)} className={`${className} transition hover:-translate-y-0.5 hover:border-brand/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

export function Checkbox({ checked, onChange, title, description, tone = "default", disabled }: { checked: boolean; onChange: (checked: boolean) => void; title: ReactNode; description?: ReactNode; tone?: "default" | "danger"; disabled?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand/20 ${checked ? (tone === "danger" ? "border-danger/40 bg-danger-soft/50" : "border-brand/40 bg-brand-soft/50") : "border-border hover:bg-subtle/60"} ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className={`mt-0.5 size-4 shrink-0 rounded border-input ${tone === "danger" ? "accent-[var(--danger)]" : "accent-[var(--brand)]"}`} />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>}
      </span>
    </label>
  );
}
