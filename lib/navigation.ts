export type NavIcon = "dashboard" | "notifications" | "profile" | "security" | "legal" | "audit" | "users" | "platform";
export interface NavSection {
  titleKey?: "nav.account" | "nav.platform";
  items: {
    labelKey:
      | "nav.dashboard"
      | "notifications.title"
      | "common.profile"
      | "common.security"
      | "nav.legalDocuments"
      | "nav.auditTrail"
      | "nav.users"
      | "nav.platformSetup";
    href: string;
    icon: NavIcon;
  }[];
}
export const NAVIGATION: NavSection[] = [
  { items: [
    { labelKey: "nav.dashboard", href: "/dashboard", icon: "dashboard" },
    { labelKey: "notifications.title", href: "/notifications", icon: "notifications" },
  ] },
  { titleKey: "nav.platform", items: [
    { labelKey: "nav.users", href: "/users", icon: "users" },
    { labelKey: "nav.legalDocuments", href: "/legal-documents", icon: "legal" },
    { labelKey: "nav.auditTrail", href: "/audit-trail", icon: "audit" },
    { labelKey: "nav.platformSetup", href: "/platform-setup", icon: "platform" },
  ] },
  { titleKey: "nav.account", items: [
    { labelKey: "common.profile", href: "/settings/profile", icon: "profile" },
    { labelKey: "common.security", href: "/settings/security", icon: "security" },
  ] },
];
