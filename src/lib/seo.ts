import type { Metadata } from "next";
import type { DirectoryFilters } from "@/types/domain";
import { absoluteUrl } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export function buildMetadata(input: {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
  keywords?: string[];
}): Metadata {
  const title = `${input.title} | ${siteConfig.name}`;
  const url = absoluteUrl(input.path ?? "/");

  return {
    title,
    description: input.description,
    keywords: input.keywords,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url),
    alternates: { canonical: url },
    robots: input.noindex
      ? {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        }
      : undefined,
    openGraph: {
      title,
      description: input.description,
      url,
      locale: siteConfig.locale,
      type: "website",
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
    },
  };
}

export function shouldNoIndexDirectoryFilters(filters: DirectoryFilters) {
  const meaningful = Object.entries(filters).filter(([key, value]) => {
    if (key === "page" || key === "sort") return false;
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "boolean") return value;
    return true;
  });

  if (meaningful.length === 0) return false;

  const keys = new Set(meaningful.map(([key]) => key));
  const allowed = new Set(["cat", "location"]);
  for (const key of keys) {
    if (!allowed.has(key)) return true;
  }

  return false;
}
