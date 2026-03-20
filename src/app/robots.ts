import type { MetadataRoute } from "next";
import { isSeoIndexingAllowed } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();
  const allowIndexing = isSeoIndexingAllowed();

  return {
    rules: allowIndexing
      ? {
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
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
