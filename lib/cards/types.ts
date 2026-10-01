export type CardScheme = "verve" | "afrigo" | "visa" | "mastercard";
export type CardStatus = "active" | "frozen" | "terminated";
export type FreezeSource = "user" | "admin" | "scheme_disabled";
export type Currency = "NGN" | "USD" | (string & {});
/** Money is always an integer in minor units (kobo / cents), keyed by currency. */
export type MoneyByCurrency = Record<string, number>;

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface CardProduct {
  id: string;
  currency: Currency;
  issuer_country: string;
  is_active: boolean;
  supports_rules?: boolean;
}

export interface CardSchemeRead {
  id: string;
  code: CardScheme;
  name: string;
  enabled: boolean;
  disabled_reason: string | null;
  disabled_at: string | null;
  products: CardProduct[];
  updated_at: string;
}

export interface AdminCard {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  label: string;
  scheme: CardScheme;
  currency: Currency;
  status: CardStatus;
  freeze_source: FreezeSource | null;
  freeze_reason: string | null;
  last4: string | null;
  balance: number;
  created_at: string;
}

export interface CardActivity {
  id: string;
  card_id: string | null;
  card_label: string | null;
  scheme: CardScheme | null;
  user_id: string | null;
  user_email: string | null;
  amount: number;
  currency: Currency | null;
  merchant_name: string | null;
  merchant_category: string | null;
  channel: string | null;
  approved: boolean;
  response_code: string;
  reason: string;
  created_at: string;
}

export interface DeclineReasonCount {
  reason: string;
  count: number;
}

export interface AuthorizationWindowStats {
  approved: number;
  declined: number;
  approved_volume?: MoneyByCurrency;
  top_decline_reasons?: DeclineReasonCount[];
}

export interface CardStats {
  cardholders: number;
  cards_by_scheme_status: { scheme: CardScheme; status: CardStatus; count: number }[];
  funds_held?: MoneyByCurrency;
  last_24h: AuthorizationWindowStats;
  last_7d: AuthorizationWindowStats;
}

export interface Merchant {
  slug: string;
  name: string;
  category: string;
  mcc_codes: string[];
  is_active: boolean;
}

export interface MerchantInput {
  slug: string;
  name: string;
  category: string;
  descriptor_patterns: string[];
  mcc_codes?: string[];
}

export type MerchantPatch = Partial<Omit<MerchantInput, "slug">> & { is_active?: boolean };

export interface ObservedMerchant {
  merchant_name: string;
  merchant_category: string | null;
  attempts: number;
  approved: number;
  declined: number;
  distinct_cards: number;
  approved_volume?: MoneyByCurrency;
  first_seen: string;
  last_seen: string;
  matched_merchant: string | null;
  suggested_slug: string | null;
  suggested_pattern: string | null;
}

export type ReconciliationKind = "missing_locally" | "missing_at_sudo" | "status_mismatch" | "amount_mismatch";
export type ReconciliationStatus = "open" | "resolved";

export interface ReconciliationIssue {
  id: string;
  card_id: string | null;
  sudo_card_id: string;
  sudo_authorization_id: string;
  kind: ReconciliationKind;
  details: Record<string, unknown>;
  status: ReconciliationStatus;
  detected_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

export type WalletSyncStatus = "pending" | "done" | "failed" | "cancelled";
export type WalletSyncKind = "deposit" | "sweep_out" | "sweep_in";

export interface WalletSyncJob {
  id: string;
  card_id: string;
  kind: WalletSyncKind;
  amount: number;
  currency: Currency;
  status: WalletSyncStatus;
  attempts: number;
  last_error: string | null;
  created_at: string;
  done_at: string | null;
}

export interface WalletComparison {
  card_id: string;
  currency: Currency;
  ledger_balance: number;
  sudo_wallet_balance: number;
  pending_net: number;
  expected_wallet_after_pending: number;
  in_sync: boolean;
  drift: number;
}
