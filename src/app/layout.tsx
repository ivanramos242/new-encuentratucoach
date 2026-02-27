import type { Metadata } from "next";
import { FavoriteCoachesProvider } from "@/components/favorites/favorite-coaches-provider";
import { Poppins } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/lib/site-config";
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
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={`${poppins.variable} bg-zinc-50 text-zinc-950 antialiased`}>
        <FavoriteCoachesProvider>
          <div className="min-h-screen bg-zinc-50">
            <SiteHeader />
            {children}
            <SiteFooter />
          </div>
        </FavoriteCoachesProvider>
      </body>
    </html>
  );
}
