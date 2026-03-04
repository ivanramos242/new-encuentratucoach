import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Cómo elegir coach en 2026",
  description:
    "Checklist práctico para elegir coach en 2026: especialidad, metodología, señales de confianza y decisión final.",
  path: "/como-elegir-coach-2026",
  keywords: [
    "como elegir coach",
    "elegir coach 2026",
    "coach online o presencial",
    "coach certificado",
    "mejor coach para mi",
  ],
});

export default function ChooseCoachGuidePage() {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Cómo elegir coach en 2026", path: "/como-elegir-coach-2026" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PageHero
        badge="Checklist 2026"
        title="Cómo elegir coach en 2026"
        description="Marco práctico para pasar de la duda a una shortlist de perfiles que realmente encajen con tu objetivo."
      />

      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Checklist de decisión</h2>
          <ol className="mt-4 grid gap-2 text-sm text-zinc-700">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">1. Define objetivo en una frase medible.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">2. Filtra por especialidad y contexto (ciudad o online).</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">3. Evalúa metodología y experiencia en casos similares.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">4. Compara precio, frecuencia y formato de sesiones.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">5. Contacta 2-3 perfiles con el mismo briefing.</li>
          </ol>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Señales de buen encaje</h2>
          <ul className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Responde con claridad y sin promesas mágicas.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Define objetivos y métricas de avance desde el inicio.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Te propone estructura de proceso y próximos pasos.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Tiene reseñas o señales de confianza verificables.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Pasa a acción</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/coaches" className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Abrir directorio
            </Link>
            <Link href="/coaches/categoria/personal" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
              Empezar por coaching personal
            </Link>
            <Link href="/coaches/categoria/liderazgo" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
              Ver liderazgo
            </Link>
            <Link href="/coaches/ciudad/barcelona" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
              Coaches en Barcelona
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}
