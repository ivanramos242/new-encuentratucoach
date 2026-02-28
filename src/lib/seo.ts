import type { Metadata } from "next";
import type { DirectoryFilters } from "@/types/domain";
import { siteConfig } from "@/lib/site-config";
import { absoluteUrl } from "@/lib/utils";

function readBooleanEnv(name: string, defaultValue = false) {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return defaultValue;
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function readPositiveIntEnv(name: string, defaultValue: number) {
  const raw = process.env[name];
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.max(1, Math.floor(parsed));
}

export function isSeoIndexingAllowed() {
  return readBooleanEnv("SEO_ALLOW_INDEXING", false);
}

export function getSeoMinCoachesIndexable() {
  return readPositiveIntEnv("SEO_MIN_COACHES_INDEXABLE", 3);
}

export function getQaMinAnswersIndexable() {
  return readPositiveIntEnv("QA_INDEX_MIN_ANSWERS", 2);
}

export function shouldNoIndexLanding(input: { coachCount: number; hasEditorialContent?: boolean }) {
  if (!isSeoIndexingAllowed()) return true;
  if (!(input.hasEditorialContent ?? true)) return true;
  return input.coachCount < getSeoMinCoachesIndexable();
}

export function hasMeaningfulQueryParams(input: Record<string, string | string[] | undefined>) {
  return Object.values(input).some((value) => {
    if (value == null) return false;
    if (Array.isArray(value)) return value.some((item) => item.trim().length > 0);
    return value.trim().length > 0;
  });
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}

export function buildMetadata(input: {
  title: string;
  description: string;
  path?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  keywords?: string[];
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const title = `${input.title} | ${siteConfig.name}`;
  const url = input.canonicalUrl || absoluteUrl(input.path ?? "/");
  const noindex = input.noindex || !isSeoIndexingAllowed();

  return {
    title,
    description: input.description,
    keywords: input.keywords,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url),
    alternates: { canonical: url },
    robots: noindex
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
      type: input.type || "website",
      siteName: siteConfig.name,
      images: input.image ? [{ url: input.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: input.image ? [input.image] : undefined,
    },
  };
}

export function shouldNoIndexDirectoryFilters(filters: DirectoryFilters) {
  if (!isSeoIndexingAllowed()) return true;

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
