import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { QaQuestionListing } from "@/components/qa/question-listing";
import { buildMetadata } from "@/lib/seo";
import { getQaQuestionsList, getQaTopicBySlug } from "@/lib/v2-mock";

type ParamsInput = Promise<{ topicSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { topicSlug } = await params;
  const topic = getQaTopicBySlug(topicSlug);
  if (!topic) return buildMetadata({ title: "Tema no encontrado", description: "Tema no encontrado", noindex: true });
  return buildMetadata({
    title: `Preguntas sobre ${topic.name}`,
    description: topic.description,
    path: `/pregunta-a-un-coach/tema/${topic.slug}`,
  });
}

export default async function QaTopicPage({ params }: { params: ParamsInput }) {
  const { topicSlug } = await params;
  const topic = getQaTopicBySlug(topicSlug);
  if (!topic) notFound();

  const questions = getQaQuestionsList({ topicSlug });

  return (
    <>
      <PageHero badge="Q&A tema curado" title={`Preguntas sobre ${topic.name}`} description={topic.description} />
      <PageShell className="pt-8">
        <QaQuestionListing questions={questions} />
      </PageShell>
    </>
  );
}
