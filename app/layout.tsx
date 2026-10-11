import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";

import { branding } from "@/config/branding";
import { siteConfig } from "@/config/site";
import { appTitleTemplate } from "@/lib/metadata";

import "@/styles/globals.css";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsentServer } from "@/components/features/settings/legal/cookie-consent-server";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// Bundled (OFL, from @fontsource/jetbrains-mono) so the build never fetches it:
// Google Fonts' response for JetBrains Mono broke next/font/google on Vercel.
const jetbrainsMono = localFont({
  src: [
    { path: "../public/fonts/JetBrainsMono/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/JetBrainsMono/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

const metadataBase =
  process.env.NEXT_PUBLIC_APP_URL != null &&
  process.env.NEXT_PUBLIC_APP_URL.length > 0
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: siteConfig.name,
    template: appTitleTemplate,
  },
  description: siteConfig.description,
  icons: {
    icon: [{ url: branding.appIcon, type: "image/png" }],
    apple: [{ url: branding.appIcon, sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    type: "website",
    images: [{ url: branding.appIcon }],
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [branding.appIcon],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans",
        inter.variable,
        jetbrainsMono.variable,
      )}
    >
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-dvh font-sans antialiased",
          inter.variable,
          jetbrainsMono.variable,
        )}
      >
        <ThemeProvider>
          <TooltipProvider delay={200}>{children}</TooltipProvider>
          <CookieConsentServer />
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
