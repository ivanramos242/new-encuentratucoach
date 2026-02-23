import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { QaQuestionListing } from "@/components/qa/question-listing";
import { buildMetadata } from "@/lib/seo";
import { getQaQuestionsList } from "@/lib/v2-mock";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Buscar preguntas",
    description: "Busqueda interna de preguntas de coaching.",
    path: "/pregunta-a-un-coach/buscar",
    noindex: true,
  });
}

export default async function QaSearchPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const params = await searchParams;
  const qRaw = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = qRaw?.trim() ?? "";
  const results = q ? getQaQuestionsList({ q }) : getQaQuestionsList().slice(0, 10);

  return (
    <>
      <PageHero
        badge="Noindex"
        title="Buscar preguntas"
        description="Resultados de busqueda interna del modulo Pregunta a un coach."
      />
      <PageShell className="pt-8">
        <form className="mb-6 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por duda, tema, etiqueta..."
              className="flex-1 rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
            />
            <button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
              Buscar
            </button>
          </div>
        </form>
        <QaQuestionListing
          questions={results}
          emptyTitle="No hay resultados"
          emptyDescription="Prueba otra busqueda o revisa las preguntas recientes."
        />
      </PageShell>
    </>
  );
}
