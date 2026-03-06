import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

const FAQ_ITEMS = [
  {
    q: "¿Cómo elegir coach sin perder tiempo?",
    a: "Empieza por tu objetivo, filtra por especialidad y compara solo dos o tres perfiles con el mismo criterio.",
  },
  {
    q: "¿Qué señales indican buen encaje?",
    a: "Claridad al explicar cómo trabaja, experiencia en casos parecidos, proceso entendible y expectativas realistas.",
  },
  {
    q: "¿Cuántos coaches conviene comparar?",
    a: "Entre dos y tres suele ser suficiente. Más opciones no siempre mejoran la decisión y sí pueden generar bloqueo.",
  },
] as const;

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
  const baseUrl = getSiteBaseUrl();
  const path = "/como-elegir-coach-2026";
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Cómo elegir coach en 2026", path },
  ]);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Cómo elegir coach en 2026",
    description: "Checklist para elegir coach con criterio y pasar a una shortlist útil.",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl}${path}` },
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <JsonLd data={[breadcrumb, articleSchema, faqSchema]} />
      <PageHero
        badge="Checklist 2026"
        title="Cómo elegir coach en 2026"
        description="Marco práctico para pasar de la duda a una shortlist de perfiles que realmente encajen con tu objetivo."
      />

      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-900">
            <i className="fa-solid fa-compass-drafting mr-2" aria-hidden="true" />
            Regla simple
          </p>
          <p className="mt-3 text-base leading-7 text-zinc-800">
            No elijas por intuición o por una promesa bonita. Elige por encaje entre tu objetivo, la especialidad del
            coach, el proceso que propone y las señales de confianza que muestra.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            <i className="fa-solid fa-list-check mr-2 text-cyan-700" aria-hidden="true" />
            Checklist de decisión
          </h2>
          <ol className="mt-4 grid gap-2 text-sm text-zinc-700">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">1. Define tu objetivo en una frase que puedas medir o comprobar.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">2. Filtra por especialidad y contexto: ciudad o modalidad online.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">3. Evalúa experiencia, tipo de cliente y metodología.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">4. Compara precio, frecuencia y qué incluye la primera sesión.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">5. Contacta 2 o 3 perfiles con el mismo briefing para comparar respuesta.</li>
          </ol>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">
              <i className="fa-solid fa-thumbs-up mr-2 text-emerald-600" aria-hidden="true" />
              Señales de buen encaje
            </h2>
            <ul className="mt-4 grid gap-2 text-sm text-zinc-700">
              <li className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">Responde con claridad y sin promesas mágicas.</li>
              <li className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">Explica cómo trabaja y cuál sería el siguiente paso.</li>
              <li className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">Tiene señales de confianza visibles: reseñas, certificación o perfil completo.</li>
              <li className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">Su propuesta encaja con tu momento y tu presupuesto.</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">
              <i className="fa-solid fa-ban mr-2 text-rose-600" aria-hidden="true" />
              Errores que conviene evitar
            </h2>
            <ul className="mt-4 grid gap-2 text-sm text-zinc-700">
              <li className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">Comparar diez perfiles y bloquearte por exceso de opciones.</li>
              <li className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">Elegir solo por precio sin mirar especialidad ni proceso.</li>
              <li className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">No explicar bien tu objetivo al hacer el primer contacto.</li>
              <li className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">Confundir popularidad en redes con encaje profesional real.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            <i className="fa-solid fa-link mr-2 text-cyan-700" aria-hidden="true" />
            Recursos para afinar la decisión
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link href="/precios-coaching-espana" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950"><i className="fa-solid fa-euro-sign mr-2 text-cyan-700" aria-hidden="true" />Precios de coaching</p>
              <p className="mt-2 text-sm text-zinc-700">Contrasta tarifas antes de pasar a una shortlist final.</p>
            </Link>
            <Link href="/que-es-el-coaching-y-para-que-sirve" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950"><i className="fa-solid fa-compass mr-2 text-cyan-700" aria-hidden="true" />Qué es el coaching</p>
              <p className="mt-2 text-sm text-zinc-700">Asegúrate de que buscas el tipo de ayuda adecuado.</p>
            </Link>
            <Link href="/faqs" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950"><i className="fa-solid fa-circle-question mr-2 text-cyan-700" aria-hidden="true" />FAQs</p>
              <p className="mt-2 text-sm text-zinc-700">Resuelve dudas de duración, formatos y certificación.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            <i className="fa-solid fa-circle-question mr-2 text-cyan-700" aria-hidden="true" />
            Preguntas frecuentes
          </h2>
          <div className="mt-4 grid gap-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <summary className="cursor-pointer font-semibold text-zinc-900">{item.q}</summary>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            <i className="fa-solid fa-arrow-right mr-2 text-cyan-700" aria-hidden="true" />
            Siguiente paso recomendado
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Si ya tienes claro tu objetivo, no sigas leyendo: pasa al directorio y compara solo los perfiles que realmente encajan.
          </p>
          <div className="mt-4">
            <Link href="/coaches" className="inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Abrir directorio de coaches
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}
