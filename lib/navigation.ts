export type NavIcon = "dashboard" | "profile" | "security";
export interface NavSection {
  titleKey?: "nav.account";
  items: { labelKey: "nav.dashboard" | "common.profile" | "common.security"; href: string; icon: NavIcon }[];
}
export const NAVIGATION: NavSection[] = [
  { items: [{ labelKey: "nav.dashboard", href: "/dashboard", icon: "dashboard" }] },
  { titleKey: "nav.account", items: [
    { labelKey: "common.profile", href: "/settings/profile", icon: "profile" },
    { labelKey: "common.security", href: "/settings/security", icon: "security" },
  ] },
];
