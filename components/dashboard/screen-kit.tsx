"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/provider";

const PATHS = {
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  alert: <path d="M12 9v4m0 3.5v.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  arrowDownLeft: <path d="M17 7 7 17m0-8v8h8" />,
  arrowUpRight: <path d="M7 17 17 7m0 8V7H9" />,
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19M6.5 15h4" />
    </>
  ),
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />,
  play: <path d="M7 4.5v15l12-7.5-12-7.5Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8m0-4v4h4m-4 5a8 8 0 0 0 14.3 4.9L20 16m0 4v-4h-4" />,
  scale: <path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7Zm14 0-3 7a3 3 0 0 0 6 0l-3-7Z" />,
  snowflake: <path d="M12 2v20M4.9 6l14.2 12M19.1 6 4.9 18M9 4l3 2 3-2M9 20l3-2 3 2M3.5 9.5 6.4 10l-.9 2.9M20.5 14.5l-2.9-.5.9-2.9M3.5 14.5l2.9-.5-.9-2.9M20.5 9.5l-2.9.5.9 2.9" />,
  store: (
    <>
      <path d="M4 10v10h16V10M3 4h18l-1 6H4L3 4Z" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  sync: <path d="M4 7h13l-3-3m6 13H7l3 3" />,
  unlock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.6-1.7" />
    </>
  ),
  wallet: (
    <>
      <path d="M19 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6" />
      <path d="M16 13.5h.01" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  arrowRight: <path d="M5 12h14m-6-6 6 6-6 6" />,
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  checkAll: <path d="M2 12.5 6.5 17 15 7.5M11 16l1 1 9-10" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9zM9 12l2 2 4-4M9 17h6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  filter: <path d="M4 5h16l-6 8v6l-4-2v-4L4 5Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </>
  ),
  idCard: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8 17c.5-2 2-3 4-3s3.5 1 4 3" />
    </>
  ),
  info: <path d="M12 8v.01M12 12v5m9-5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  pencil: <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Zm9-13 4 4" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="10" cy="8" r="4" />
      <path d="M2 21c0-4 3.6-7 8-7 1 0 2 .2 2.9.5M18 14v6M15 17h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c2 .7 3.5 2.6 3.5 5.6" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}

export function ConfigPageHeader({
  title,
  description,
  icon,
  actions,
  showBackLink = true,
  backHref = "/configuration",
  backLabel,
}: {
  title: string;
  description?: ReactNode;
  icon: IconName;
  actions?: ReactNode;
  showBackLink?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  const { t } = useI18n();
  const resolvedBackLabel = backLabel ?? t("nav.configuration");
  return (
    <header className="mb-6 space-y-4">
      {showBackLink && (
        <Link href={backHref} className="inline-flex items-center gap-1.5 rounded-md py-1 text-sm font-medium text-muted transition hover:text-foreground pointer-coarse:py-2">
          <Icon name="arrowLeft" className="size-4" />
          {resolvedBackLabel}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Icon name={icon} className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
      </div>
    </header>
  );
}

export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (value: string) => void; placeholder: string; label?: string }) {
  const { t } = useI18n();
  const id = useId();
  const resolvedLabel = label ?? t("common.search");
  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="sr-only">{resolvedLabel}</label>
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, 200))}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm outline-none transition placeholder:text-muted/60 pointer-coarse:h-11 pointer-coarse:text-base focus:border-brand focus:ring-3 focus:ring-brand/20"
      />
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-subtle text-muted">
        <Icon name={icon} className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function IconButton({ label, icon, onClick, disabled, tone = "default" }: { label: string; icon: IconName; onClick: () => void; disabled?: boolean; tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`inline-flex size-9 items-center justify-center rounded-lg text-muted transition focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40 pointer-coarse:size-11 ${
        tone === "danger" ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-subtle hover:text-foreground"
      }`}
    >
      <Icon name={icon} className="size-[1.125rem]" />
    </button>
  );
}

export function SkeletonRows({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-label={t("common.loading")} className="animate-pulse divide-y divide-border">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: columns }).map((__, cell) => (
            <div key={cell} className={`h-4 rounded bg-subtle ${cell === 0 ? "w-1/4" : "w-1/6"} ${cell > 2 ? "hidden md:block" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <Icon name="info" className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold">{t("common.couldntLoad")}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      <button type="button" onClick={onRetry} className="mt-5 inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-subtle">
        {t("common.tryAgain")}
      </button>
    </div>
  );
}
