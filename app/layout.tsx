import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { themeInitScript } from "@/lib/theme";
import { AppProviders } from "@/components/providers/app-providers";
import { getServerLocale } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Garde Admin",
    template: "%s · Garde Admin",
  },
  description: "Garde staff dashboard",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the layout use the safe-area insets on notched phones.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getServerLocale();

  return (
    // data-theme is set by the inline script before hydration, hence suppressHydrationWarning.
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh flex flex-col font-sans"><AppProviders initialLocale={locale}>{children}</AppProviders></body>
    </html>
  );
}
