export type NavIcon = "dashboard" | "profile" | "security";
export interface NavSection {
  title?: string;
  items: { label: string; href: string; icon: NavIcon }[];
}
export const NAVIGATION: NavSection[] = [
  { items: [{ label: "Dashboard", href: "/dashboard", icon: "dashboard" }] },
  { title: "Account", items: [
    { label: "Profile", href: "/settings/profile", icon: "profile" },
    { label: "Security", href: "/settings/security", icon: "security" },
  ] },
];
