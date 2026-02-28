import { getQaMinAnswersIndexable } from "@/lib/seo";
import { renderSitemapUrlset, xmlResponse } from "@/lib/sitemap-xml";
import { qaQuestions } from "@/lib/v2-mock";

export async function GET() {
  const minAnswers = getQaMinAnswersIndexable();
  const entries = qaQuestions
    .filter(
      (question) =>
        question.status === "published" &&
        question.answers.filter((answer) => answer.status === "published").length >= minAnswers,
    )
    .map((question) => ({
      path: `/pregunta-a-un-coach/${question.slug}`,
      lastModified: question.updatedAt,
    }));

  return xmlResponse(renderSitemapUrlset(entries));
}
