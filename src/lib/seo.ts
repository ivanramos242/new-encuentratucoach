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
  return readPositiveIntEnv("SEO_MIN_COACHES_INDEXABLE", 2);
}

export function getQaMinAnswersIndexable() {
  return readPositiveIntEnv("QA_INDEX_MIN_ANSWERS", 2);
}

export function getQaMinListingQuestionsIndexable() {
  return readPositiveIntEnv("QA_INDEX_MIN_LISTING_QUESTIONS", 2);
}

export function shouldNoIndexLanding(input: { coachCount: number; hasEditorialContent?: boolean }) {
  if (!(input.hasEditorialContent ?? true)) return true;
  return input.coachCount < getSeoMinCoachesIndexable();
}

export function shouldNoIndexQaListing(input: {
  questionCount: number;
  answerCount: number;
  hasIntroContent?: boolean;
}) {
  if (!(input.hasIntroContent ?? true)) return true;
  if (input.questionCount < getQaMinListingQuestionsIndexable()) return true;
  return input.answerCount < getQaMinAnswersIndexable();
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

type JsonLd = Record<string, unknown>;

export function normalizeCanonicalPath(path = "/") {
  if (!path || path === "/") return "/";
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean.replace(/\/+$/, "");
}

export function buildMetadata(input: {
  title: string;
  description: string;
  path?: string;
  canonicalUrl?: string;
  canonicalPath?: string;
  noindex?: boolean;
  keywords?: string[];
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const canonicalPath = normalizeCanonicalPath(input.canonicalPath ?? input.path ?? "/");
  const canonicalUrl = input.canonicalUrl || absoluteUrl(canonicalPath);
  const brandedTitle = input.title.includes(siteConfig.name) ? input.title : `${input.title} | ${siteConfig.name}`;
  const noindex = Boolean(input.noindex);

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url),
    alternates: { canonical: canonicalUrl },
    robots: noindex
      ? {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        }
      : undefined,
    openGraph: {
      title: brandedTitle,
      description: input.description,
      url: canonicalUrl,
      locale: siteConfig.locale,
      type: input.type || "website",
      siteName: siteConfig.name,
      images: input.image ? [{ url: input.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description: input.description,
      images: input.image ? [input.image] : undefined,
    },
  };
}

export function directoryHasSearchState(filters: DirectoryFilters) {
  return Boolean(
    filters.q ||
      filters.cat ||
      filters.location ||
      filters.session?.length ||
      filters.certified ||
      filters.idioma ||
      typeof filters.priceMin === "number" ||
      typeof filters.priceMax === "number" ||
      (filters.sort && filters.sort !== "recent") ||
      (filters.page && filters.page > 1),
  );
}

export function buildDirectoryCanonicalPath(
  filters: DirectoryFilters,
  validCategories: Set<string>,
  validCities: Set<string>,
) {
  const category = filters.cat?.trim().toLowerCase();
  const city = filters.location?.trim().toLowerCase();
  if (category && city && validCategories.has(category) && validCities.has(city)) {
    return `/coaches/categoria/${category}/${city}`;
  }
  if (category && validCategories.has(category)) {
    return `/coaches/categoria/${category}`;
  }
  if (city && validCities.has(city)) {
    return `/coaches/ciudad/${city}`;
  }
  return "/coaches";
}

export function countWords(chunks: Array<string | undefined | null>) {
  return chunks
    .filter(Boolean)
    .flatMap((chunk) => String(chunk).trim().split(/\s+/))
    .filter(Boolean).length;
}

export function shouldIndexListing(resultCount: number, contentWordCount: number) {
  return resultCount >= 3 && contentWordCount >= 350;
}

export function buildOrganizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/favicon.ico"),
  };
}

export function buildWebsiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/coaches?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbList(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildItemListSchema(input: {
  name: string;
  path: string;
  items: Array<{ name: string; path: string }>;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: absoluteUrl(input.path),
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export function buildPersonSchema(input: {
  name: string;
  description: string;
  path: string;
  image?: string;
  sameAs?: Array<string | undefined>;
  areaServed?: string[];
  availableLanguage?: string[];
  knowsAbout?: string[];
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    description: input.description,
    image: input.image,
    url: absoluteUrl(input.path),
    sameAs: (input.sameAs ?? []).filter(Boolean),
    areaServed: input.areaServed,
    availableLanguage: input.availableLanguage,
    knowsAbout: input.knowsAbout,
  };
}

export function buildArticleSchema(input: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  image?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    image: input.image,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: input.authorName
      ? {
          "@type": "Organization",
          name: input.authorName,
        }
      : undefined,
    mainEntityOfPage: absoluteUrl(input.path),
  };
}
