import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

const FAQ_ITEMS = [
  {
    q: "¿Cuánto cuesta una sesión de coaching en España?",
    a: "Depende de la especialidad, la experiencia y el formato, pero muchos procesos se mueven entre 60€ y 220€ por sesión.",
  },
  {
    q: "¿El coaching online es más barato?",
    a: "A menudo sí, aunque no siempre. El precio también cambia por posicionamiento del coach, nicho y duración de la sesión.",
  },
  {
    q: "¿Qué conviene comparar además del precio?",
    a: "Especialidad real, claridad del proceso, frecuencia, modalidad, reseñas y señales de confianza.",
  },
] as const;

export const metadata = buildMetadata({
  title: "Precios de coaching en España",
  description:
    "Rangos orientativos de precios de coaching en España por especialidad, formato online o presencial y experiencia del coach.",
  path: "/precios-coaching-espana",
  keywords: [
    "precios coaching españa",
    "cuanto cuesta un coach",
    "precio coaching online",
    "tarifa coach personal",
    "coach madrid precio",
  ],
});

export default function CoachingPricingGuidePage() {
  const baseUrl = getSiteBaseUrl();
  const path = "/precios-coaching-espana";
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Precios de coaching en España", path },
  ]);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Precios de coaching en España",
    description: "Guía práctica para entender rangos, variables de precio y cómo comparar sin pagar de más.",
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
        badge="Guía de precios"
        title="Precios de coaching en España"
        description="Qué influye en el precio por sesión, rangos habituales y cómo comparar propuestas sin pagar de más."
      />

      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-900">
            <i className="fa-solid fa-wallet mr-2" aria-hidden="true" />
            Resumen rápido
          </p>
          <p className="mt-3 text-base leading-7 text-zinc-800">
            La mayoría de precios se explican por tres variables: especialidad, experiencia y formato. El objetivo no
            es encontrar la sesión más barata, sino la mejor relación entre encaje, proceso y coste total.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            <i className="fa-solid fa-tags mr-2 text-cyan-700" aria-hidden="true" />
            Rangos orientativos por sesión
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["fa-user", "Coaching personal", "60€ - 120€", "Suele variar por experiencia, modalidad y duración de la sesión."],
              ["fa-briefcase", "Coaching de carrera", "70€ - 140€", "Sube cuando el proceso incluye reposicionamiento, entrevistas o estrategia laboral."],
              ["fa-people-group", "Coaching de liderazgo", "90€ - 220€", "Los precios suelen crecer con el nivel de responsabilidad y complejidad del contexto."],
              ["fa-building", "Coaching ejecutivo", "120€ - 300€", "Es el rango con mayor dispersión por perfil de cliente y especialización."],
            ].map(([icon, title, price, text]) => (
              <article key={title} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-black tracking-tight text-zinc-950">
                    <i className={`fa-solid ${icon} mr-2 text-cyan-700`} aria-hidden="true" />
                    {title}
                  </h3>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-zinc-900">{price}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-600">
            Son rangos informativos. Cada coach define su tarifa según experiencia, nicho, ciudad, duración y modalidad.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">
              <i className="fa-solid fa-sliders mr-2 text-cyan-700" aria-hidden="true" />
              Qué hace subir o bajar el precio
            </h2>
            <ul className="mt-4 grid gap-2 text-sm text-zinc-700">
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Especialidad y nivel de complejidad del proceso.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Trayectoria, certificación y reputación del coach.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Formato online o presencial y duración de la sesión.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Incluye o no seguimiento entre sesiones, bonos o materiales.</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">
              <i className="fa-solid fa-scale-balanced mr-2 text-cyan-700" aria-hidden="true" />
              Cómo comparar precios con criterio
            </h2>
            <ol className="mt-4 grid gap-2 text-sm text-zinc-700">
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">1. Define objetivo y horizonte temporal.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">2. Compara especialidad real y tipo de cliente al que suele ayudar.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">3. Mira modalidad, frecuencia y primera sesión.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">4. Revisa reseñas, certificación y claridad del proceso.</li>
            </ol>
          </article>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            <i className="fa-solid fa-link mr-2 text-cyan-700" aria-hidden="true" />
            Recursos útiles antes de decidir
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link href="/como-elegir-coach-2026" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950"><i className="fa-solid fa-list-check mr-2 text-cyan-700" aria-hidden="true" />Cómo elegir coach</p>
              <p className="mt-2 text-sm text-zinc-700">Checklist para pasar del precio al encaje real.</p>
            </Link>
            <Link href="/coaches/modalidad/online" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950"><i className="fa-solid fa-laptop mr-2 text-cyan-700" aria-hidden="true" />Coaching online</p>
              <p className="mt-2 text-sm text-zinc-700">Filtra perfiles remotos y compara precios y modalidades.</p>
            </Link>
            <Link href="/coaches/certificados" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950"><i className="fa-solid fa-shield-halved mr-2 text-cyan-700" aria-hidden="true" />Coaches certificados</p>
              <p className="mt-2 text-sm text-zinc-700">Añade señales de confianza a la comparación final.</p>
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
            Si ya sabes qué rango te encaja, compara perfiles reales con precio visible y contexto suficiente para decidir.
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
