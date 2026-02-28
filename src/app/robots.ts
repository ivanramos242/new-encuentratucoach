import type { MetadataRoute } from "next";
import { isSeoIndexingAllowed } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();
  const allowIndexing = isSeoIndexingAllowed();
  return {
    rules: allowIndexing
      ? {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/mi-cuenta", "/api"],
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-core.xml`,
      `${baseUrl}/sitemap-coaches.xml`,
      `${baseUrl}/sitemap-landings.xml`,
      `${baseUrl}/sitemap-blog.xml`,
      `${baseUrl}/sitemap-qa-questions.xml`,
      `${baseUrl}/sitemap-qa-topics.xml`,
    ],
    host: baseUrl,
  };
}
