import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { QaQuestionListing } from "@/components/qa/question-listing";
import { buildMetadata } from "@/lib/seo";
import { cities } from "@/lib/mock-data";
import { getQaQuestionsList } from "@/lib/v2-mock";

type ParamsInput = Promise<{ ciudadSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { ciudadSlug } = await params;
  const city = cities.find((item) => item.slug === ciudadSlug);
  if (!city) return buildMetadata({ title: "Ciudad no encontrada", description: "Ciudad no encontrada", noindex: true });
  return buildMetadata({
    title: `Preguntas de coaching en ${city.name}`,
    description: `Preguntas y respuestas publicas sobre coaching en ${city.name}.`,
    path: `/pregunta-a-un-coach/ciudad/${city.slug}`,
  });
}

export default async function QaCityPage({ params }: { params: ParamsInput }) {
  const { ciudadSlug } = await params;
  const city = cities.find((item) => item.slug === ciudadSlug);
  if (!city) notFound();

  const questions = getQaQuestionsList({ citySlug: ciudadSlug });
  return (
    <>
      <PageHero
        badge="Q&A ciudad curada"
        title={`Preguntas de coaching en ${city.name}`}
        description={`Contenido generado por usuarios y coaches activos con foco local en ${city.name}.`}
      />
      <PageShell className="pt-8">
        <QaQuestionListing questions={questions} />
      </PageShell>
    </>
  );
}
