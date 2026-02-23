import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { QaQuestionListing } from "@/components/qa/question-listing";
import { buildMetadata } from "@/lib/seo";
import { coachCategories } from "@/lib/mock-data";
import { getQaQuestionsList } from "@/lib/v2-mock";

type ParamsInput = Promise<{ categoriaSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug } = await params;
  const category = coachCategories.find((item) => item.slug === categoriaSlug);
  if (!category) return buildMetadata({ title: "Categoria no encontrada", description: "Categoria no encontrada", noindex: true });
  return buildMetadata({
    title: `Preguntas de ${category.name}`,
    description: `Preguntas publicas sobre ${category.name.toLowerCase()} en la plataforma.`,
    path: `/pregunta-a-un-coach/categoria/${category.slug}`,
  });
}

export default async function QaCategoryPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug } = await params;
  const category = coachCategories.find((item) => item.slug === categoriaSlug);
  if (!category) notFound();

  const questions = getQaQuestionsList({ categorySlug: categoriaSlug });
  return (
    <>
      <PageHero
        badge="Q&A categoria curada"
        title={`Preguntas de ${category.name}`}
        description={`Explora preguntas y respuestas publicas relacionadas con ${category.name.toLowerCase()}.`}
      />
      <PageShell className="pt-8">
        <QaQuestionListing questions={questions} />
      </PageShell>
    </>
  );
}
