"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/dashboard/screen-kit";
import { useI18n } from "@/lib/i18n/provider";
import { useCountries } from "@/lib/query/countries";

function total(data: { meta: { total_items: number } } | undefined) {
  return data ? data.meta.total_items.toLocaleString() : undefined;
}

function ConfigCard({
  href,
  icon,
  title,
  description,
  stats,
  badge,
}: {
  href: string;
  icon: IconName;
  title: string;
  description: string;
  stats: { label: string; value: string | undefined }[];
  badge?: string;
}) {
  const { href: localizedHref, t } = useI18n();
  return (
    <Link
      href={localizedHref(href)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-6"
    >
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand-soft opacity-70 blur-2xl transition duration-300 group-hover:scale-125 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand ring-1 ring-brand/15 transition group-hover:bg-brand group-hover:text-brand-foreground">
          <Icon name={icon} className="size-6" />
        </span>
        {badge && <Badge tone="neutral">{badge}</Badge>}
      </div>
      <h2 className="relative mt-5 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-muted">{description}</p>
      <dl className="relative mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="text-xs text-muted">{stat.label}</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums">
              {stat.value ?? <span aria-hidden className="inline-block h-5 w-10 animate-pulse rounded bg-subtle align-middle" />}
            </dd>
          </div>
        ))}
      </dl>
      <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
        {t("common.open")}
        <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function ConfigurationPage() {
  const { t } = useI18n();
  const countries = useCountries({ page: 1, pageSize: 20 });

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("platformSetup.hubTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
          {t("platformSetup.hubDescription")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        <ConfigCard
          href="/configuration/countries"
          icon="globe"
          title={t("platformSetup.countriesTitle")}
          description={t("platformSetup.countriesCardDescription")}
          stats={[{ label: t("platformSetup.countriesTitle"), value: total(countries.data) }]}
        />
      </div>
    </div>
  );
}
