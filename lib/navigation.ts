export type NavIcon = "dashboard" | "notifications" | "profile" | "security";
export interface NavSection {
  titleKey?: "nav.account";
  items: { labelKey: "nav.dashboard" | "notifications.title" | "common.profile" | "common.security"; href: string; icon: NavIcon }[];
}
export const NAVIGATION: NavSection[] = [
  { items: [
    { labelKey: "nav.dashboard", href: "/dashboard", icon: "dashboard" },
    { labelKey: "notifications.title", href: "/notifications", icon: "notifications" },
  ] },
  { titleKey: "nav.account", items: [
    { labelKey: "common.profile", href: "/settings/profile", icon: "profile" },
    { labelKey: "common.security", href: "/settings/security", icon: "security" },
  ] },
];
