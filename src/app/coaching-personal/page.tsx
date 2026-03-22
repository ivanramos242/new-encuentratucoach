import Link from "next/link";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { filterAndSortCoaches } from "@/lib/directory";
import { faqItems } from "@/lib/mock-data";
import { buildArticleSchema, buildBreadcrumbList, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Coaching personal en España: encuentra coach y compara perfiles",
  description:
    "Qué es el coaching personal, cuándo tiene sentido y cómo elegir coach comparando precio, modalidad y señales de confianza.",
  path: "/coaching-personal",
});

export default function PersonalCoachingPage() {
  const personalCoaches = filterAndSortCoaches({ cat: "personal", sort: "recent", page: 1 });
  const jsonLd = [
    buildBreadcrumbList([
      { name: "Inicio", path: "/" },
      { name: "Coaching personal", path: "/coaching-personal" },
    ]),
    buildArticleSchema({
      headline: "Coaching personal en España: encuentra coach y compara perfiles",
      description:
        "Qué es el coaching personal, cuándo tiene sentido y cómo elegir coach comparando precio, modalidad y señales de confianza.",
      path: "/coaching-personal",
      authorName: "EncuentraTuCoach",
    }),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero
        badge="Guía + landing canónica"
        title="Coaching personal"
        description="Qué mirar antes de contratar, cuánto suele costar y cómo pasar a un shortlist de coaches con encaje real."
      />
      <PageShell className="pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Cómo usar esta página</h2>
          <p className="mt-3 leading-7 text-zinc-700">
            Esta URL sustituye a la antigua versión con slash y concentra la intención “coaching personal”. Desde aquí derivamos a la landing de categoría y a perfiles reales para no dispersar señales SEO.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/coaches/categoria/personal" className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white">
              Ver coaches de coaching personal
            </Link>
            <Link href="/coaches" className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white">
              Abrir directorio
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Coaches recomendados</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {personalCoaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Checklist rápida</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">Define objetivo, bloqueo actual y plazo antes de contactar.</li>
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">Compara precio por sesión, modalidad y experiencia real.</li>
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">Habla con 2–3 coaches antes de decidir para evitar una mala primera elección.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Preguntas frecuentes</h2>
            <div className="mt-4 space-y-4">
              {faqItems.slice(0, 3).map((faq) => (
                <article key={faq.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                  <h3 className="text-sm font-black tracking-tight text-zinc-950">{faq.question}</h3>
                  <div className="mt-2 text-sm leading-6 text-zinc-700" dangerouslySetInnerHTML={{ __html: faq.answerHtml }} />
                </article>
              ))}
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}
