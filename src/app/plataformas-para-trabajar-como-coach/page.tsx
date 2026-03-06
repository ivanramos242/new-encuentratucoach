import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

const FAQ_ITEMS = [
  {
    q: "¿Qué debe ofrecer una buena plataforma para coaches?",
    a: "Visibilidad en búsquedas con intención real, perfil profesional claro, trazabilidad de resultados y un modelo de coste entendible.",
  },
  {
    q: "¿Es mejor pagar cuota fija o comisión por cliente?",
    a: "Depende del canal, pero para muchos coaches una cuota fija es más predecible y permite calcular mejor el retorno a 90 días.",
  },
  {
    q: "¿Cómo saber si una plataforma genera leads de calidad?",
    a: "Revisando si el usuario llega comparando especialidad, ciudad, precio y señales de confianza, no solo por tráfico genérico.",
  },
] as const;

export const metadata = buildMetadata({
  title: "Plataformas para trabajar como coach",
  description:
    "Comparativa práctica de plataformas para coaches: criterios de visibilidad, calidad de leads, coste real de captación y señales de confianza.",
  path: "/plataformas-para-trabajar-como-coach",
  keywords: [
    "plataformas para coaches",
    "plataforma para trabajar como coach",
    "captar clientes como coach",
    "membresía para coaches",
    "comparativa plataformas coaches",
  ],
});

export default function PlatformsForCoachesPage() {
  const baseUrl = getSiteBaseUrl();
  const path = "/plataformas-para-trabajar-como-coach";
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Plataformas para trabajar como coach", path },
  ]);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Plataformas para trabajar como coach",
    description: "Qué evaluar antes de pagar una plataforma si quieres captar clientes como coach de forma sostenible.",
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
        badge="Guía B2B para coaches"
        title="Plataformas para trabajar como coach"
        description="Qué evaluar antes de pagar una membresía: visibilidad SEO, calidad del lead, reglas de contacto y retorno esperado."
      />
      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-900">Respuesta corta</p>
          <p className="mt-3 text-base leading-7 text-zinc-800">
            La mejor plataforma para un coach no es la que promete más tráfico, sino la que te coloca delante de
            personas que ya están buscando ayuda por especialidad, ciudad o modalidad y te deja medir visitas,
            clics y contactos con claridad.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Qué mirar antes de pagar</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Intención del tráfico", "Prioriza búsquedas transaccionales como “coach en Madrid” o “coaching online”, no solo volumen genérico."],
              ["Modelo de coste", "Diferencia entre cuota fija, comisión por lead y costes ocultos de permanencia o visibilidad extra."],
              ["Señales de confianza", "Perfil completo, reseñas, certificación visible y claridad de precios mejoran la conversión."],
              ["Control del contacto", "Necesitas saber si el lead te llega directo, si compites con muchos coaches y cuánto tarda en convertirse."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <h3 className="text-base font-black tracking-tight text-zinc-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Checklist rápido de decisión</h2>
            <ol className="mt-4 grid gap-2 text-sm text-zinc-700">
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">1. Define tu nicho principal y la ciudad o modalidad que quieres atacar.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">2. Calcula cuánto te puedes permitir pagar durante 90 días antes de exigir retorno.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">3. Revisa si la plataforma te posiciona por especialidad y si el perfil se puede diferenciar de verdad.</li>
              <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">4. Exige métricas: visitas de perfil, clics de contacto y trazabilidad del lead.</li>
            </ol>
          </article>

          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Errores frecuentes</h2>
            <ul className="mt-4 grid gap-2 text-sm text-zinc-700">
              <li className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">Elegir por precio sin mirar calidad del tráfico.</li>
              <li className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">Esperar resultados con un perfil vago o sin especialidad concreta.</li>
              <li className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">No medir el tiempo entre alta, primera visita y primer contacto.</li>
              <li className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">Depender solo de redes sociales y no construir activos SEO propios.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Compara antes de decidir</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link href="/membresia" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950">Ver membresía</p>
              <p className="mt-2 text-sm text-zinc-700">Entiende el modelo, el precio y cómo funciona la captación en EncuentraTuCoach.</p>
            </Link>
            <Link href="/conseguir-clientes-como-coach" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950">Cómo conseguir clientes</p>
              <p className="mt-2 text-sm text-zinc-700">Complementa la membresía con una estrategia más amplia de adquisición.</p>
            </Link>
            <Link href="/blog" className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white">
              <p className="text-sm font-black text-zinc-950">Blog y recursos</p>
              <p className="mt-2 text-sm text-zinc-700">Consulta guías para optimizar tu perfil, tu mensaje y tu conversión.</p>
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
            Si quieres evaluar una opción concreta con precio, visibilidad y funcionamiento claros, revisa la membresía.
          </p>
          <div className="mt-4">
            <Link href="/membresia" className="inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Ver membresía
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}
