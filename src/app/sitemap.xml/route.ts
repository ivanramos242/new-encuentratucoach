import { renderSitemapIndex, xmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

const CHILD_SITEMAPS = [
  "/sitemap-core.xml",
  "/sitemap-coaches.xml",
  "/sitemap-landings.xml",
  "/sitemap-blog.xml",
  "/sitemap-qa-questions.xml",
  "/sitemap-qa-topics.xml",
];

export async function GET() {
  return xmlResponse(renderSitemapIndex(CHILD_SITEMAPS));
}
