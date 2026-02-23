import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { QaQuestionListing } from "@/components/qa/question-listing";
import { buildMetadata } from "@/lib/seo";
import { getQaQuestionsList } from "@/lib/v2-mock";

type ParamsInput = Promise<{ tagSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { tagSlug } = await params;
  return buildMetadata({
    title: `Tag ${tagSlug}`,
    description: `Listado por tag ${tagSlug} en Pregunta a un coach.`,
    path: `/pregunta-a-un-coach/tag/${tagSlug}`,
    noindex: true,
  });
}

export default async function QaTagPage({ params }: { params: ParamsInput }) {
  const { tagSlug } = await params;
  const questions = getQaQuestionsList({ tagSlug });
  return (
    <>
      <PageHero badge="Noindex" title={`Preguntas con tag #${tagSlug}`} description="Listado por tag (noindex por defecto)." />
      <PageShell className="pt-8">
        <QaQuestionListing questions={questions} />
      </PageShell>
    </>
  );
}
