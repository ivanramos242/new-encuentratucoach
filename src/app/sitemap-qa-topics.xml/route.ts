import { renderSitemapUrlset, xmlResponse } from "@/lib/sitemap-xml";
import { qaQuestions, qaTopics } from "@/lib/v2-mock";

export async function GET() {
  const entries = qaTopics
    .filter((topic) => topic.curated)
    .map((topic) => {
      const latest = qaQuestions
        .filter((question) => question.status === "published" && question.topicSlug === topic.slug)
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];

      return {
        path: `/pregunta-a-un-coach/tema/${topic.slug}`,
        lastModified: latest?.updatedAt ?? new Date().toISOString(),
      };
    });

  return xmlResponse(renderSitemapUrlset(entries));
}
