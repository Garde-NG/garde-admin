import type { MessagePath } from "@/lib/i18n/provider";
import type { CardScheme, FreezeSource, ReconciliationKind, WalletSyncKind, WalletSyncStatus } from "./types";

/** Every money field from the API is an integer in minor units. */
export function formatMoney(minor: number, currency: string | null | undefined, locale: string, options: { compact?: boolean; signed?: boolean } = {}) {
  const value = minor / 100;
  const base: Intl.NumberFormatOptions = options.compact
    ? { notation: "compact", maximumFractionDigits: 1 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  const sign = options.signed ? { signDisplay: "exceptZero" as const } : {};
  if (!currency) return new Intl.NumberFormat(locale, { ...base, ...sign }).format(value);
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol", ...base, ...sign }).format(value);
  } catch {
    return `${currency} ${new Intl.NumberFormat(locale, { ...base, ...sign }).format(value)}`;
  }
}

export function formatNumber(value: number, locale: string, compact = false) {
  return new Intl.NumberFormat(locale, compact ? { notation: "compact", maximumFractionDigits: 1 } : {}).format(value);
}

export function formatDateTime(value: string | null | undefined, locale: string, style: "short" | "medium" = "short") {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: style }).format(new Date(value));
}

export function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

export function formatRelative(value: string, locale: string, now = Date.now()) {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 60) return rtf.format(seconds, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), "day");
  return formatDate(value, locale) ?? "";
}

/** Card-activity date filters are UTC calendar days. */
export function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateText: string, days: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

export function shortId(value: string) {
  return value.length <= 16 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`;
}

/* ---------- Schemes ---------- */

export const SCHEMES: CardScheme[] = ["verve", "afrigo", "visa", "mastercard"];

export const SCHEME_META: Record<CardScheme, { name: string; currency: string; face: string }> = {
  verve: { name: "Verve", currency: "NGN", face: "from-[#0b3d2e] via-[#0d5a43] to-[#11785a]" },
  afrigo: { name: "AfriGo", currency: "NGN", face: "from-[#3a2a07] via-[#6b4a0c] to-[#94690f]" },
  visa: { name: "Visa", currency: "USD", face: "from-[#0f1a4a] via-[#1a2b78] to-[#2840a8]" },
  mastercard: { name: "Mastercard", currency: "USD", face: "from-[#2a0f12] via-[#4c1a1d] to-[#7a2a22]" },
};

export function schemeName(code: string | null | undefined) {
  if (!code) return "—";
  return SCHEME_META[code as CardScheme]?.name ?? code;
}

/* ---------- Freeze ---------- */

export const FREEZE_SOURCE_LABEL: Record<FreezeSource, MessagePath> = {
  user: "cards.freezeSourceUser",
  admin: "cards.freezeSourceAdmin",
  scheme_disabled: "cards.freezeSourceScheme",
};

/* ---------- Authorization reasons ---------- */

export const REASON_LABEL: Record<string, MessagePath> = {
  rules_passed: "cardActivity.reasonRulesPassed",
  no_rules: "cardActivity.reasonNoRules",
  merchant_not_allowed: "cardActivity.reasonMerchantNotAllowed",
  category_blocked: "cardActivity.reasonCategoryBlocked",
  channel_not_allowed: "cardActivity.reasonChannelNotAllowed",
  country_not_allowed: "cardActivity.reasonCountryNotAllowed",
  single_use_spent: "cardActivity.reasonSingleUseSpent",
  rules_expired: "cardActivity.reasonRulesExpired",
  per_txn_limit: "cardActivity.reasonPerTxnLimit",
  daily_limit: "cardActivity.reasonDailyLimit",
  monthly_limit: "cardActivity.reasonMonthlyLimit",
  platform_limit: "cardActivity.reasonPlatformLimit",
  insufficient_funds: "cardActivity.reasonInsufficientFunds",
  card_not_active: "cardActivity.reasonCardNotActive",
  currency_mismatch: "cardActivity.reasonCurrencyMismatch",
  spending_controls: "cardActivity.reasonSpendingControls",
  unknown_card: "cardActivity.reasonUnknownCard",
};

export const DECLINE_REASONS = Object.keys(REASON_LABEL).filter((reason) => reason !== "rules_passed" && reason !== "no_rules");

export function reasonLabel(reason: string, t: (path: MessagePath) => string) {
  const key = REASON_LABEL[reason];
  return key ? t(key) : reason.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/* ---------- Reconciliation ---------- */

export type Severity = "high" | "medium" | "low";

export const RECON_KINDS: ReconciliationKind[] = ["missing_locally", "status_mismatch", "amount_mismatch", "missing_at_sudo"];

export const RECON_META: Record<ReconciliationKind, { severity: Severity; label: MessagePath; meaning: MessagePath; action: MessagePath }> = {
  missing_locally: { severity: "high", label: "reconciliation.kindMissingLocally", meaning: "reconciliation.meaningMissingLocally", action: "reconciliation.actionMissingLocally" },
  status_mismatch: { severity: "high", label: "reconciliation.kindStatusMismatch", meaning: "reconciliation.meaningStatusMismatch", action: "reconciliation.actionStatusMismatch" },
  amount_mismatch: { severity: "medium", label: "reconciliation.kindAmountMismatch", meaning: "reconciliation.meaningAmountMismatch", action: "reconciliation.actionAmountMismatch" },
  missing_at_sudo: { severity: "low", label: "reconciliation.kindMissingAtSudo", meaning: "reconciliation.meaningMissingAtSudo", action: "reconciliation.actionMissingAtSudo" },
};

export const SEVERITY_META: Record<Severity, { label: MessagePath; tone: "danger" | "warning" | "neutral" }> = {
  high: { label: "reconciliation.severityHigh", tone: "danger" },
  medium: { label: "reconciliation.severityMedium", tone: "warning" },
  low: { label: "reconciliation.severityLow", tone: "neutral" },
};

/* ---------- Wallet sync ---------- */

export const JOB_KIND_META: Record<WalletSyncKind, { label: MessagePath; hint: MessagePath }> = {
  deposit: { label: "walletSync.kindDeposit", hint: "walletSync.kindDepositHint" },
  sweep_out: { label: "walletSync.kindSweepOut", hint: "walletSync.kindSweepOutHint" },
  sweep_in: { label: "walletSync.kindSweepIn", hint: "walletSync.kindSweepInHint" },
};

export const JOB_STATUS_META: Record<WalletSyncStatus, { label: MessagePath; tone: "neutral" | "warning" | "success" | "danger" }> = {
  pending: { label: "walletSync.statusPending", tone: "warning" },
  done: { label: "walletSync.statusDone", tone: "success" },
  failed: { label: "walletSync.statusFailed", tone: "danger" },
  cancelled: { label: "walletSync.statusCancelled", tone: "neutral" },
};

/* ---------- Merchants ---------- */

export const SLUG_PATTERN = /^[a-z0-9_]{2,40}$/;
export const MCC_PATTERN = /^\d{4}$/;

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

/** A descriptor pattern needs at least 4 letters/digits so it can't match too broadly. */
export function isValidPattern(value: string) {
  return (value.match(/[\p{L}\p{N}]/gu)?.length ?? 0) >= 4;
}

export function titleCase(value: string) {
  return value.toLowerCase().replace(/(^|[\s\-_.&/])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}
