import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/coaches", "/blog"],
      disallow: [
        "/admin",
        "/mi-cuenta",
        "/api",
        "/iniciar-sesion",
        "/registro",
        "/recuperar-contrasena",
        "/_next/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
