import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { faqItems } from "@/lib/mock-data";
import { buildBreadcrumbList, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Pregunta a un coach",
  description:
    "Aclara dudas frecuentes sobre precios, modalidad, certificación y cómo elegir coach antes de contactar.",
  path: "/pregunta-a-un-coach",
});

export default function AskCoachPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Inicio", path: "/" },
          { name: "Pregunta a un coach", path: "/pregunta-a-un-coach" },
        ])}
      />
      <PageHero
        badge="Hub de dudas frecuentes"
        title="Pregunta a un coach"
        description="Aclara dudas antes de contactar. Esta página concentra preguntas frecuentes y enlaza al directorio y a las categorías más demandadas."
      />
      <PageShell className="pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Empieza por aquí</h2>
          <p className="mt-3 leading-7 text-zinc-700">
            Si ya tienes una necesidad concreta, ve directo al directorio o a una landing de especialidad. Si aún estás valorando opciones, usa estas preguntas para ordenar la decisión.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/coaches" className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white">
              Ver directorio
            </Link>
            <Link href="/coaches/categoria/personal" className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white">
              Coaching personal
            </Link>
            <Link href="/membresia" className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white">
              Membresía para coaches
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Preguntas frecuentes</h2>
          <div className="mt-4 space-y-4">
            {faqItems.map((faq) => (
              <article key={faq.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <h3 className="text-sm font-black tracking-tight text-zinc-950">{faq.question}</h3>
                <div className="mt-2 text-sm leading-6 text-zinc-700" dangerouslySetInnerHTML={{ __html: faq.answerHtml }} />
              </article>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  );
}
