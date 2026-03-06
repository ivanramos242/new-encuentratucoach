import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

const FAQ_ITEMS = [
  {
    q: "¿Qué es el coaching en pocas palabras?",
    a: "Es un proceso de acompañamiento orientado a objetivos concretos, claridad y acción. No sustituye terapia ni atención médica.",
  },
  {
    q: "¿Para qué sirve el coaching?",
    a: "Puede ayudar a ordenar decisiones, mejorar hábitos, trabajar liderazgo, afrontar una transición profesional o ganar foco en un objetivo concreto.",
  },
  {
    q: "¿Cómo sé si necesito un coach y no otro profesional?",
    a: "Si buscas avanzar en un objetivo definido y necesitas estructura, seguimiento y conversación orientada a la acción, el coaching puede encajar. Si hay malestar clínico, trauma o salud mental, conviene acudir a un profesional sanitario.",
  },
] as const;

export const metadata = buildMetadata({
  title: "Qué es el coaching y para qué sirve",
  description:
    "Guía práctica para entender qué es el coaching, cuándo tiene sentido, qué esperar en sesiones y cómo elegir un coach por especialidad y ciudad.",
  path: "/que-es-el-coaching-y-para-que-sirve",
  keywords: [
    "que es el coaching",
    "para que sirve el coaching",
    "coaching vs terapia",
    "como elegir coach",
    "coaching en españa",
  ],
});

export default function CoachingWhatIsGuidePage() {
  const baseUrl = getSiteBaseUrl();
  const path = "/que-es-el-coaching-y-para-que-sirve";
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Qué es el coaching y para qué sirve", path },
  ]);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Qué es el coaching y para qué sirve",
    description: "Guía para entender cuándo el coaching aporta valor y cómo pasar de la teoría a una decisión útil.",
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
        badge="Guía evergreen"
        title="Qué es el coaching y para qué sirve"
        description="Entiende el coaching sin ruido: cuándo aporta valor, qué esperar en sesiones y cómo elegir perfil según tu objetivo."
      />

      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-900">Respuesta corta</p>
          <p className="mt-3 text-base leading-7 text-zinc-800">
            El coaching es una relación profesional orientada a avanzar en un objetivo específico. Suele servir cuando
            necesitas claridad, plan de acción, seguimiento y conversación enfocada en resultados.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Qué puedes esperar de un proceso</h2>
            <ul className="mt-4 grid gap-2 text-sm text-zinc-700">
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Objetivo definido desde el inicio o afinado en la primera sesión.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Preguntas y estructura para pasar de la confusión a la acción.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Compromisos concretos entre sesiones y revisión de avances.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Un marco temporal y una expectativa razonable de trabajo.</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Qué no es coaching</h2>
            <ul className="mt-4 grid gap-2 text-sm text-zinc-700">
              <li className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">No sustituye terapia psicológica ni tratamiento médico.</li>
              <li className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">No debería prometer resultados mágicos o inmediatos.</li>
              <li className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">No es útil si el objetivo es tan difuso que no se puede trabajar.</li>
              <li className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">No funciona bien si no hay implicación entre sesiones.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Cuándo suele ayudar más</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Transición profesional", "Cambio de trabajo, redefinición de perfil o preparación de entrevistas."],
              ["Hábitos y productividad", "Ordenar prioridades, sostener cambios y mejorar foco personal."],
              ["Liderazgo", "Gestionar equipos, delegar mejor y tomar decisiones con más claridad."],
              ["Relaciones o decisiones complejas", "Trabajar conversaciones difíciles, límites y opciones reales."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <h3 className="text-base font-black tracking-tight text-zinc-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Cómo pasar de la teoría a una decisión útil</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link href="/como-elegir-coach-2026" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950">Cómo elegir coach</p>
              <p className="mt-2 text-sm text-zinc-700">Usa una checklist realista para hacer shortlist con criterio.</p>
            </Link>
            <Link href="/precios-coaching-espana" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950">Precios de coaching</p>
              <p className="mt-2 text-sm text-zinc-700">Revisa rangos habituales antes de comparar perfiles.</p>
            </Link>
            <Link href="/faqs" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950">Preguntas frecuentes</p>
              <p className="mt-2 text-sm text-zinc-700">Aclara dudas de formatos, certificación y duración del proceso.</p>
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Preguntas frecuentes</h2>
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
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Siguiente paso recomendado</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Si ya tienes una idea bastante clara de tu objetivo, pasa al directorio y compara perfiles por especialidad, ciudad y presupuesto.
          </p>
          <div className="mt-4">
            <Link href="/coaches" className="inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Ver directorio de coaches
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}
