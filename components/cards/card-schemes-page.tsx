"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfigPageHeader, EmptyState, ErrorState, Icon } from "@/components/dashboard/screen-kit";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalActions } from "@/components/ui/modal";
import { TextArea } from "@/components/ui/text-area";
import { useToast } from "@/components/ui/toast";
import { Checkbox, SchemeChip } from "@/components/cards/shared";
import { useI18n } from "@/lib/i18n/provider";
import { cardOpsKey, useCardSchemes, useCardStats, useSchemeActions } from "@/lib/query/cards";
import { SCHEMES, formatDateTime, formatNumber } from "@/lib/cards/format";
import { useQueryClient } from "@tanstack/react-query";
import type { CardScheme, CardSchemeRead, CardStats, CardStatus } from "@/lib/cards/types";

function countsFor(stats: CardStats | undefined, code: CardScheme) {
  const rows = stats?.cards_by_scheme_status.filter((row) => row.scheme === code) ?? [];
  const get = (status: CardStatus) => rows.find((row) => row.status === status)?.count ?? 0;
  return stats ? { active: get("active"), frozen: get("frozen"), terminated: get("terminated") } : undefined;
}

export function CardSchemesPage() {
  const { t } = useI18n();
  const schemes = useCardSchemes();
  const stats = useCardStats();
  const client = useQueryClient();
  const [disabling, setDisabling] = useState<CardSchemeRead | null>(null);
  const [enabling, setEnabling] = useState<CardSchemeRead | null>(null);
  const [bulk, setBulk] = useState<string | null>(null);

  // Bulk freeze/unfreeze runs in the background: refresh card data a few times while it settles.
  useEffect(() => {
    if (!bulk) return;
    const timers = [3000, 8000, 15000].map((delay) => window.setTimeout(() => client.invalidateQueries({ queryKey: cardOpsKey }), delay));
    const done = window.setTimeout(() => setBulk(null), 16000);
    return () => [...timers, done].forEach((timer) => window.clearTimeout(timer));
  }, [bulk, client]);

  const ordered = [...(schemes.data ?? [])].sort((a, b) => SCHEMES.indexOf(a.code) - SCHEMES.indexOf(b.code));
  const enabledCount = ordered.filter((scheme) => scheme.enabled).length;

  return (
    <div className="space-y-5">
      <ConfigPageHeader
        icon="layers"
        title={t("schemes.title")}
        description={t("schemes.description")}
      />

      {bulk && (
        <div role="status" className="flex animate-fade-in items-center gap-3 rounded-2xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm">
          <span aria-hidden className="size-4 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="min-w-0 flex-1">{bulk}</p>
        </div>
      )}

      {schemes.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-border bg-subtle/40" />)}
        </div>
      ) : schemes.isError ? (
        <section className="rounded-2xl border border-border bg-surface shadow-card"><ErrorState message={schemes.error.message} onRetry={() => schemes.refetch()} /></section>
      ) : ordered.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface shadow-card"><EmptyState icon="layers" title={t("schemes.empty")} /></section>
      ) : (
        <>
          <p className="text-sm text-muted">{t("schemes.summary").replace("{enabled}", String(enabledCount)).replace("{total}", String(ordered.length))}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {ordered.map((scheme) => (
              <SchemeCard key={scheme.code} scheme={scheme} counts={countsFor(stats.data, scheme.code)} onDisable={() => setDisabling(scheme)} onEnable={() => setEnabling(scheme)} />
            ))}
          </div>
        </>
      )}

      <DisableModal scheme={disabling} counts={disabling ? countsFor(stats.data, disabling.code) : undefined} onClose={() => setDisabling(null)} onBulk={setBulk} />
      <EnableModal scheme={enabling} counts={enabling ? countsFor(stats.data, enabling.code) : undefined} onClose={() => setEnabling(null)} onBulk={setBulk} />
    </div>
  );
}

function SchemeCard({ scheme, counts, onDisable, onEnable }: { scheme: CardSchemeRead; counts?: { active: number; frozen: number; terminated: number }; onDisable: () => void; onEnable: () => void }) {
  const { href, t, locale } = useI18n();
  return (
    <article className={`flex flex-col rounded-2xl border bg-surface p-5 shadow-card sm:p-6 ${scheme.enabled ? "border-border" : "border-danger/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight"><SchemeChip scheme={scheme.code} className="text-lg" /></h2>
          <p className="mt-0.5 font-mono text-xs text-muted">{scheme.code}</p>
        </div>
        {scheme.enabled ? (
          <Badge tone="success" className="gap-1"><span aria-hidden className="size-1.5 rounded-full bg-current" />{t("schemes.enabled")}</Badge>
        ) : (
          <Badge tone="danger" className="gap-1"><Icon name="ban" className="size-3" />{t("schemes.disabled")}</Badge>
        )}
      </div>

      {!scheme.enabled && (
        <div className="mt-4 rounded-xl bg-danger-soft/60 p-3 text-sm">
          <p className="font-medium text-danger">{t("schemes.disabledNotice")}</p>
          <p className="mt-1 text-muted">
            {scheme.disabled_reason ? `“${scheme.disabled_reason}”` : t("schemes.noReason")}
            {scheme.disabled_at && <> · {formatDateTime(scheme.disabled_at, locale)}</>}
          </p>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-border py-4">
        {(["active", "frozen", "terminated"] as const).map((status) => (
          <div key={status} className="min-w-0">
            <dt className="text-xs text-muted">{t(status === "active" ? "cards.statusActive" : status === "frozen" ? "cards.statusFrozen" : "cards.statusTerminated")}</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {counts ? (
                <Link href={href(`/cards?scheme=${scheme.code}&status=${status}`)} className="rounded hover:text-brand hover:underline">{formatNumber(counts[status], locale)}</Link>
              ) : (
                <span aria-hidden className="inline-block h-6 w-8 animate-pulse rounded bg-subtle align-middle" />
              )}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-4 flex-1 space-y-2">
        {scheme.products.map((product) => (
          <li key={product.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-md bg-subtle px-1.5 py-0.5 font-mono text-xs font-medium">{product.currency}</span>
            <span className="text-muted">{t("schemes.issuedIn")} {product.issuer_country}</span>
            {!product.is_active && <Badge>{t("schemes.productInactive")}</Badge>}
            {product.supports_rules === false && <Badge tone="warning" className="cursor-help"><span title={t("schemes.issuerControlledHint")}>{t("schemes.issuerControlled")}</span></Badge>}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{t("schemes.updated")} {formatDateTime(scheme.updated_at, locale)}</p>
        {scheme.enabled ? (
          <Button variant="secondary" className="text-danger" onClick={onDisable}><Icon name="ban" className="size-4" />{t("schemes.disable")}</Button>
        ) : (
          <Button onClick={onEnable}><Icon name="check" className="size-4" />{t("schemes.enable")}</Button>
        )}
      </div>
    </article>
  );
}

function DisableModal({ scheme, counts, onClose, onBulk }: { scheme: CardSchemeRead | null; counts?: { active: number; frozen: number }; onClose: () => void; onBulk: (message: string) => void }) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { disable } = useSchemeActions();
  const [reason, setReason] = useState("");
  const [freezeExisting, setFreezeExisting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const active = counts?.active;
  const needsConfirm = freezeExisting && (active ?? 0) > 0;
  const confirmed = !needsConfirm || confirmText.trim().toLowerCase() === scheme?.code;

  const close = () => {
    if (disable.isPending) return;
    setReason("");
    setFreezeExisting(false);
    setConfirmText("");
    onClose();
  };

  return (
    <Modal open={Boolean(scheme)} onClose={close} title={t("schemes.disableTitle").replace("{name}", scheme?.name ?? "")}>
      {scheme && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!confirmed) return;
            disable.mutate(
              { code: scheme.code, reason: reason.trim() || undefined, freezeExisting },
              {
                onSuccess: () => {
                  toast.success(t("schemes.disableSuccess").replace("{name}", scheme.name));
                  if (freezeExisting) onBulk(t("schemes.freezingInBackground").replace("{name}", scheme.name));
                  close();
                },
                onError: (error) => toast.error(error.message),
              },
            );
          }}
        >
          <p className="text-sm text-muted">{t("schemes.disableBody")}</p>
          <TextArea label={t("cards.reason")} hint={t("schemes.reasonHint")} placeholder={t("schemes.reasonPlaceholder")} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={255} showCount rows={2} />
          <Checkbox
            checked={freezeExisting}
            onChange={setFreezeExisting}
            tone="danger"
            title={active === undefined ? t("schemes.freezeExisting") : t(active === 1 ? "schemes.freezeExistingCountOne" : "schemes.freezeExistingCount").replace("{count}", formatNumber(active, locale))}
            description={t("schemes.freezeExistingHint")}
          />
          {needsConfirm && (
            <div className="space-y-1.5">
              <label htmlFor="confirm-scheme" className="block text-sm font-medium">
                {t("schemes.typeToConfirm")} <code className="rounded bg-subtle px-1 font-mono">{scheme.code}</code>
              </label>
              <input id="confirm-scheme" autoComplete="off" value={confirmText} onChange={(event) => setConfirmText(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-surface px-3 font-mono text-sm outline-none transition focus:border-danger focus:ring-3 focus:ring-danger/20 pointer-coarse:h-11 pointer-coarse:text-base" />
            </div>
          )}
          <Alert tone="info">{t("schemes.disableAudit")}</Alert>
          <ModalActions>
            <Button variant="secondary" onClick={close} disabled={disable.isPending}>{t("common.cancel")}</Button>
            <Button type="submit" variant="danger" loading={disable.isPending} disabled={!confirmed}>{freezeExisting ? t("schemes.disableAndFreeze") : t("schemes.disable")}</Button>
          </ModalActions>
        </form>
      )}
    </Modal>
  );
}

function EnableModal({ scheme, counts, onClose, onBulk }: { scheme: CardSchemeRead | null; counts?: { active: number; frozen: number }; onClose: () => void; onBulk: (message: string) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const { enable } = useSchemeActions();
  const [unfreeze, setUnfreeze] = useState(true);
  const close = () => {
    if (enable.isPending) return;
    setUnfreeze(true);
    onClose();
  };
  return (
    <Modal open={Boolean(scheme)} onClose={close} title={t("schemes.enableTitle").replace("{name}", scheme?.name ?? "")}>
      {scheme && (
        <>
          <p className="text-sm text-muted">{t("schemes.enableBody")}</p>
          <Checkbox
            checked={unfreeze}
            onChange={setUnfreeze}
            title={t("schemes.unfreezeFrozen")}
            description={
              <>
                {t("schemes.unfreezeFrozenHint")}
                {counts && counts.frozen > 0 && <span className="mt-1 block">{t(counts.frozen === 1 ? "schemes.frozenOnSchemeOne" : "schemes.frozenOnScheme").replace("{count}", String(counts.frozen))}</span>}
              </>
            }
          />
          <ModalActions>
            <Button variant="secondary" onClick={close} disabled={enable.isPending}>{t("common.cancel")}</Button>
            <Button
              loading={enable.isPending}
              onClick={() =>
                enable.mutate(
                  { code: scheme.code, unfreezeFrozenCards: unfreeze },
                  {
                    onSuccess: () => {
                      toast.success(t("schemes.enableSuccess").replace("{name}", scheme.name));
                      if (unfreeze) onBulk(t("schemes.unfreezingInBackground").replace("{name}", scheme.name));
                      close();
                    },
                    onError: (error) => toast.error(error.message),
                  },
                )
              }
            >
              {t("schemes.enable")}
            </Button>
          </ModalActions>
        </>
      )}
    </Modal>
  );
}
