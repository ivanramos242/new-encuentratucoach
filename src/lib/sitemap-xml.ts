import { NextResponse } from "next/server";
import { getSiteBaseUrl } from "@/lib/site-config";

export type SitemapUrlEntry = {
  path: string;
  lastModified?: string | Date;
};

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toIsoDate(value?: string | Date) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

export function buildSitemapUrl(path: string) {
  return `${getSiteBaseUrl()}${path}`;
}

export function renderSitemapUrlset(entries: SitemapUrlEntry[]) {
  const nodes = entries
    .map((entry) => {
      const loc = xmlEscape(buildSitemapUrl(entry.path));
      const lastmod = toIsoDate(entry.lastModified);
      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${nodes}
</urlset>`;
}

export function renderSitemapIndex(paths: string[]) {
  const nodes = paths
    .map((path) => {
      const loc = xmlEscape(buildSitemapUrl(path));
      return `
  <sitemap>
    <loc>${loc}</loc>
  </sitemap>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${nodes}
</sitemapindex>`;
}

export function xmlResponse(xml: string) {
  return new NextResponse(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
