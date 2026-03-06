import { Suspense } from "react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AcquisitionAnalytics } from "@/components/analytics/acquisition-analytics";
import { CookieConsentManager } from "@/components/cookies/cookie-consent-manager";
import { DirectoryExitCapture } from "@/components/directory/directory-exit-capture";
import { FavoriteCoachesProvider } from "@/components/favorites/favorite-coaches-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { isSeoIndexingAllowed } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url),
  title: {
    default: `${siteConfig.name} | Directorio de coaches en España`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
  robots: isSeoIndexingAllowed()
    ? undefined
    : {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false, noimageindex: true },
      },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Directorio de coaches en España`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Directorio de coaches en España`,
    description: siteConfig.description,
  },
  icons: {
    icon: [{ url: "/site-logo.png", type: "image/png" }],
    shortcut: ["/site-logo.png"],
    apple: [{ url: "/site-logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} bg-zinc-50 text-zinc-950 antialiased`}>
        <FavoriteCoachesProvider>
          <div className="min-h-screen bg-zinc-50">
            <SiteHeader />
            <SiteJsonLd />
            <Suspense fallback={null}>
              <AcquisitionAnalytics />
            </Suspense>
            {children}
            <SiteFooter />
            <CookieConsentManager />
            <DirectoryExitCapture />
          </div>
        </FavoriteCoachesProvider>
      </body>
    </html>
  );
}
