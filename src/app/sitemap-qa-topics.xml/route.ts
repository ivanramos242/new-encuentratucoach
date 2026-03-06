import { shouldNoIndexQaListing } from "@/lib/seo";
import { renderSitemapUrlset, xmlResponse } from "@/lib/sitemap-xml";
import { qaQuestions, qaTopics } from "@/lib/v2-mock";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = qaTopics
    .filter((topic) => {
      if (!topic.curated) return false;

      const questions = qaQuestions.filter(
        (question) => question.status === "published" && question.topicSlug === topic.slug,
      );
      const answerCount = questions.reduce(
        (sum, question) => sum + question.answers.filter((answer) => answer.status === "published").length,
        0,
      );

      return !shouldNoIndexQaListing({
        questionCount: questions.length,
        answerCount,
        hasIntroContent: true,
      });
    })
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
