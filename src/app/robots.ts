import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/mi-cuenta", "/api"],
    },
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-qa-questions.xml`,
      `${baseUrl}/sitemap-qa-topics.xml`,
    ],
    host: baseUrl,
  };
}
