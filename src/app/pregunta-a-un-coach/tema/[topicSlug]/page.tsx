import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { QaQuestionListing } from "@/components/qa/question-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata, shouldNoIndexQaListing } from "@/lib/seo";
import { getQaQuestionsList, getQaTopicBySlug } from "@/lib/v2-mock";

type ParamsInput = Promise<{ topicSlug: string }>;

function getTopicPageStats(topicSlug: string) {
  const questions = getQaQuestionsList({ topicSlug });
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
  const { topicSlug } = await params;
  const topic = getQaTopicBySlug(topicSlug);
  if (!topic) return buildMetadata({ title: "Tema no encontrado", description: "Tema no encontrado", noindex: true });

  const stats = getTopicPageStats(topicSlug);

  return buildMetadata({
    title: `Preguntas sobre ${topic.name}`,
    description: `Dudas reales sobre ${topic.name.toLowerCase()}, respuestas publicas y enlaces para seguir comparando coaches en la plataforma.`,
    path: `/pregunta-a-un-coach/tema/${topic.slug}`,
    noindex: stats.noindex,
  });
}

export default async function QaTopicPage({ params }: { params: ParamsInput }) {
  const { topicSlug } = await params;
  const topic = getQaTopicBySlug(topicSlug);
  if (!topic) notFound();

  const { questions, publishedAnswerCount, noindex } = getTopicPageStats(topicSlug);
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Pregunta a un coach", path: "/pregunta-a-un-coach" },
    { name: topic.name, path: `/pregunta-a-un-coach/tema/${topic.slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PageHero
        badge="Q&A tema"
        title={`Preguntas sobre ${topic.name}`}
        description={`Usa esta pagina para revisar dudas reales sobre ${topic.name.toLowerCase()}, detectar patrones y pasar despues a perfiles o guias relacionadas.`}
      />
      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Que resuelve esta pagina</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Reune preguntas publicas sobre {topic.name.toLowerCase()} para entender objeciones, comparar respuestas y
            decidir si te conviene seguir hacia una guia o hacia el directorio.
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
              <p className="mt-2 text-sm font-semibold text-zinc-900">Comparar coaches o ir a una guia evergreen</p>
            </div>
          </div>
          {noindex ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Esta taxonomia sigue visible para usuarios, pero no se indexa todavia porque aun no acumula suficiente
              profundidad editorial.
            </p>
          ) : null}
        </section>

        <QaQuestionListing questions={questions} />
      </PageShell>
    </>
  );
}
