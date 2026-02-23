import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { QaQuestionAskForm } from "@/components/qa/question-ask-form";
import { QaQuestionListing } from "@/components/qa/question-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { getQaCuratedCategories, getQaCuratedCities, getQaQuestionsList, qaTopics } from "@/lib/v2-mock";

export const metadata = buildMetadata({
  title: "Pregunta a un coach",
  description:
    "Haz preguntas publicas sobre coaching y recibe respuestas de coaches activos. Modulo SEO indexable con preguntas y respuestas.",
  path: "/pregunta-a-un-coach",
});

export default function AskCoachHomePage() {
  const latest = getQaQuestionsList().slice(0, 6);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Pregunta a un coach",
          description: "Preguntas publicas y respuestas de coaches activos en la plataforma.",
        }}
      />
      <PageHero
        badge="Q&A publico SEO"
        title="Pregunta a un coach"
        description="Publica una duda (puede ser anonima), recibe respuestas de coaches activos y explora preguntas reales por tema, categoria o ciudad."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-zinc-950">Ultimas preguntas publicadas</h2>
                  <p className="mt-1 text-sm text-zinc-700">
                    Preguntas indexables y moderacion post-publicacion con reportes.
                  </p>
                </div>
                <Link href="/pregunta-a-un-coach/buscar" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Buscar preguntas
                </Link>
              </div>
            </div>
            <QaQuestionListing questions={latest} />
          </section>

          <aside className="space-y-6">
            <QaQuestionAskForm />

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Temas curados</h2>
              <div className="mt-4 grid gap-2">
                {qaTopics.filter((topic) => topic.curated).map((topic) => (
                  <Link
                    key={topic.slug}
                    href={`/pregunta-a-un-coach/tema/${topic.slug}`}
                    className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-zinc-900">{topic.name}</p>
                    <p className="mt-1 text-xs text-zinc-600">{topic.description}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Explorar por categoria</h2>
              <div className="mt-4 grid gap-2">
                {getQaCuratedCategories()
                  .filter((item) => item.questionsCount > 0)
                  .map((item) => (
                    <Link
                      key={item.slug}
                      href={`/pregunta-a-un-coach/categoria/${item.slug}`}
                      className="flex items-center justify-between rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 hover:bg-white"
                    >
                      <span className="text-sm font-semibold text-zinc-900">{item.name}</span>
                      <span className="text-xs text-zinc-500">{item.questionsCount}</span>
                    </Link>
                  ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Explorar por ciudad</h2>
              <div className="mt-4 grid gap-2">
                {getQaCuratedCities()
                  .filter((item) => item.questionsCount > 0)
                  .map((item) => (
                    <Link
                      key={item.slug}
                      href={`/pregunta-a-un-coach/ciudad/${item.slug}`}
                      className="flex items-center justify-between rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 hover:bg-white"
                    >
                      <span className="text-sm font-semibold text-zinc-900">{item.name}</span>
                      <span className="text-xs text-zinc-500">{item.questionsCount}</span>
                    </Link>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </PageShell>
    </>
  );
}
