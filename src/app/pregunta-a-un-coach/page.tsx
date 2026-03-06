import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { QaQuestionAskForm } from "@/components/qa/question-ask-form";
import { QaQuestionListing } from "@/components/qa/question-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { getQaCuratedCategories, getQaCuratedCities, getQaQuestionsList, qaTopics } from "@/lib/v2-mock";

export const metadata = buildMetadata({
  title: "Preguntas sobre coaching y cómo elegir coach",
  description:
    "Resuelve dudas sobre coaching, precio, modalidad online y cómo elegir coach. Explora preguntas reales y da el siguiente paso hacia el directorio.",
  path: "/pregunta-a-un-coach",
  keywords: [
    "preguntas sobre coaching",
    "como elegir coach",
    "precio coaching",
    "coach online o presencial",
    "dudas sobre coaching",
  ],
});

export default function AskCoachHomePage() {
  const latest = getQaQuestionsList().slice(0, 6);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Preguntas sobre coaching",
          description: "Preguntas públicas y respuestas de coaches activos en la plataforma.",
        }}
      />
      <PageHero
        badge="Dudas frecuentes sobre coaching"
        title="Preguntas sobre coaching antes de elegir coach"
        description="Explora dudas reales sobre precios, coaching online, certificación y cómo elegir coach. Si ya lo tienes claro, salta al directorio."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-zinc-950">Últimas preguntas publicadas</h2>
                  <p className="mt-1 text-sm text-zinc-700">
                    Preguntas indexables con contexto útil para decidir mejor antes de contactar a un coach.
                  </p>
                </div>
                <Link href="/pregunta-a-un-coach/buscar" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Buscar preguntas
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-black/10 bg-zinc-50 p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Qué encontrarás aquí</h2>
              <div className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-3">
                <p className="rounded-2xl border border-black/10 bg-white px-4 py-3">Preguntas sobre precio y rango habitual por sesión.</p>
                <p className="rounded-2xl border border-black/10 bg-white px-4 py-3">Diferencias entre coaching online, presencial y criterios de elección.</p>
                <p className="rounded-2xl border border-black/10 bg-white px-4 py-3">Atajos directos al directorio si ya quieres comparar perfiles reales.</p>
              </div>
            </div>
            <QaQuestionListing questions={latest} />
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Siguiente paso si ya quieres comparar coaches</h2>
              <div className="mt-4 grid gap-2">
                <Link href="/coaches" className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
                  Buscar coaches ahora
                </Link>
                <Link href="/coaches/modalidad/online" className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
                  Ver coaching online
                </Link>
                <Link href="/coaches/certificados" className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
                  Ver coaches certificados
                </Link>
              </div>
            </div>

            <QaQuestionAskForm />

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Temas más útiles para decidir</h2>
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
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Explorar por categoría</h2>
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
