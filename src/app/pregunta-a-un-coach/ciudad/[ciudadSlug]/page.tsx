import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { QaQuestionListing } from "@/components/qa/question-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata, shouldNoIndexQaListing } from "@/lib/seo";
import { cities } from "@/lib/mock-data";
import { getQaQuestionsList } from "@/lib/v2-mock";

type ParamsInput = Promise<{ ciudadSlug: string }>;

function getCityPageStats(citySlug: string) {
  const questions = getQaQuestionsList({ citySlug });
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
  const { ciudadSlug } = await params;
  const city = cities.find((item) => item.slug === ciudadSlug);
  if (!city) return buildMetadata({ title: "Ciudad no encontrada", description: "Ciudad no encontrada", noindex: true });

  const stats = getCityPageStats(ciudadSlug);

  return buildMetadata({
    title: `Preguntas de coaching en ${city.name}`,
    description: `Preguntas y respuestas publicas sobre coaching en ${city.name}, con contexto local y acceso directo a perfiles relacionados.`,
    path: `/pregunta-a-un-coach/ciudad/${city.slug}`,
    noindex: stats.noindex,
  });
}

export default async function QaCityPage({ params }: { params: ParamsInput }) {
  const { ciudadSlug } = await params;
  const city = cities.find((item) => item.slug === ciudadSlug);
  if (!city) notFound();

  const { questions, publishedAnswerCount, noindex } = getCityPageStats(ciudadSlug);
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Pregunta a un coach", path: "/pregunta-a-un-coach" },
    { name: city.name, path: `/pregunta-a-un-coach/ciudad/${city.slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PageHero
        badge="Q&A ciudad"
        title={`Preguntas de coaching en ${city.name}`}
        description={`Explora dudas reales publicadas desde ${city.name}, detecta patrones de decision y salta despues al directorio local.`}
      />
      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Como usar esta pagina</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Sirve para revisar preguntas locales sobre precio, modalidad y encaje antes de pasar a perfiles de coaches
            en {city.name}.
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
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Atajo</p>
              <p className="mt-2 text-sm font-semibold text-zinc-900">Ir al directorio de {city.name}</p>
            </div>
          </div>
          {noindex ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Esta pagina local sigue en noindex hasta reunir suficiente masa critica de preguntas y respuestas.
            </p>
          ) : null}
        </section>

        <QaQuestionListing questions={questions} />
      </PageShell>
    </>
  );
}
