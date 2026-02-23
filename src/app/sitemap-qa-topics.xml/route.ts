import { NextResponse } from "next/server";
import { qaTopics } from "@/lib/v2-mock";

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date().toISOString();
  const items = qaTopics
    .filter((topic) => topic.curated)
    .map(
      (topic) => `
  <url>
    <loc>${xmlEscape(`${base}/pregunta-a-un-coach/tema/${topic.slug}`)}</loc>
    <lastmod>${now}</lastmod>
  </url>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

