export type NavIcon = "dashboard" | "notifications" | "profile" | "security" | "legal" | "audit" | "users" | "staff" | "platform" | "card" | "activity" | "store" | "scale" | "sync";
export interface NavSection {
  titleKey?: "nav.account" | "nav.platform" | "nav.people" | "nav.cards";
  items: {
    labelKey:
      | "nav.dashboard"
      | "notifications.title"
      | "common.profile"
      | "common.security"
      | "nav.legalDocuments"
      | "nav.auditTrail"
      | "nav.customers"
      | "nav.staff"
      | "nav.configuration"
      | "nav.cardList"
      | "nav.cardActivity"
      | "nav.merchants"
      | "nav.reconciliation"
      | "nav.walletSync";
    href: string;
    icon: NavIcon;
  }[];
}
export const NAVIGATION: NavSection[] = [
  { items: [
    { labelKey: "nav.dashboard", href: "/dashboard", icon: "dashboard" },
  ] },
  { titleKey: "nav.people", items: [
    { labelKey: "nav.customers", href: "/customers", icon: "users" },
    { labelKey: "nav.staff", href: "/staff", icon: "staff" },
  ] },
  { titleKey: "nav.cards", items: [
    { labelKey: "nav.cardList", href: "/cards", icon: "card" },
    { labelKey: "nav.cardActivity", href: "/cards/activity", icon: "activity" },
    { labelKey: "nav.merchants", href: "/cards/merchants", icon: "store" },
    { labelKey: "nav.reconciliation", href: "/cards/reconciliation", icon: "scale" },
    { labelKey: "nav.walletSync", href: "/cards/wallet-sync", icon: "sync" },
  ] },
  { titleKey: "nav.platform", items: [
    { labelKey: "nav.configuration", href: "/configuration", icon: "platform" },
    { labelKey: "nav.legalDocuments", href: "/legal-documents", icon: "legal" },
    { labelKey: "nav.auditTrail", href: "/audit-trail", icon: "audit" },
  ] },
  { titleKey: "nav.account", items: [
    { labelKey: "notifications.title", href: "/notifications", icon: "notifications" },
    { labelKey: "common.profile", href: "/settings/profile", icon: "profile" },
    { labelKey: "common.security", href: "/settings/security", icon: "security" },
  ] },
];
