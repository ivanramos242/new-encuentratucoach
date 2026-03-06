import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { QaQuestionListing } from "@/components/qa/question-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata, shouldNoIndexQaListing } from "@/lib/seo";
import { coachCategories } from "@/lib/mock-data";
import { getQaQuestionsList } from "@/lib/v2-mock";

type ParamsInput = Promise<{ categoriaSlug: string }>;

function getCategoryPageStats(categorySlug: string) {
  const questions = getQaQuestionsList({ categorySlug });
  const publishedAnswerCount = questions.reduce(
    (sum, question) => sum + question.answers.filter((answer) => answer.status === "published").length,
    0,
  );
  const noindex = shouldNoIndexQaListing({
    questionCount: questions.length,
    answerCount: publishedAnswerCount,
    hasIntroContent: true,
  });

  return { questions, publishedAnswerCount, noindex };
}

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug } = await params;
  const category = coachCategories.find((item) => item.slug === categoriaSlug);
  if (!category) return buildMetadata({ title: "Categoria no encontrada", description: "Categoria no encontrada", noindex: true });

  const stats = getCategoryPageStats(categoriaSlug);

  return buildMetadata({
    title: `Preguntas de ${category.name}`,
    description: `Preguntas frecuentes sobre ${category.name.toLowerCase()}, respuestas publicas y siguiente paso hacia perfiles relacionados.`,
    path: `/pregunta-a-un-coach/categoria/${category.slug}`,
    noindex: stats.noindex,
  });
}

export default async function QaCategoryPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug } = await params;
  const category = coachCategories.find((item) => item.slug === categoriaSlug);
  if (!category) notFound();

  const { questions, publishedAnswerCount, noindex } = getCategoryPageStats(categoriaSlug);
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Pregunta a un coach", path: "/pregunta-a-un-coach" },
    { name: category.name, path: `/pregunta-a-un-coach/categoria/${category.slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PageHero
        badge="Q&A categoria"
        title={`Preguntas de ${category.name}`}
        description={`Respuestas publicas y dudas reales relacionadas con ${category.name.toLowerCase()} para orientar mejor la siguiente decision.`}
      />
      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Que encontraras aqui</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Esta taxonomia agrupa preguntas de usuarios con el mismo tipo de objetivo para que puedas comparar dudas,
            respuestas y filtros antes de elegir coach.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Preguntas</p>
              <p className="mt-2 text-2xl font-black text-zinc-950">{questions.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Respuestas publicadas</p>
              <p className="mt-2 text-2xl font-black text-zinc-950">{publishedAnswerCount}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Siguiente paso</p>
              <p className="mt-2 text-sm font-semibold text-zinc-900">Comparar coaches de esta especialidad</p>
            </div>
          </div>
          {noindex ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Esta categoria Q&A se mantiene en noindex hasta tener suficiente fondo editorial.
            </p>
          ) : null}
        </section>

        <QaQuestionListing questions={questions} />
      </PageShell>
    </>
  );
}
