import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

const ABOUT_FAQ = [
  {
    q: "Que es EncuentraTuCoach?",
    a: "Es un directorio para encontrar coach en España por especialidad, ciudad, modalidad y presupuesto, con perfiles comparables y contacto directo.",
  },
  {
    q: "Como selecciona la plataforma a los coaches certificados?",
    a: "El distintivo de coach certificado aparece cuando se revisa documentación enviada por el profesional.",
  },
  {
    q: "Solo sirve para clientes o tambien para coaches?",
    a: "La plataforma está diseñada para ambos: clientes que buscan coach y coaches que quieren visibilidad orgánica con membresía.",
  },
  {
    q: "En que zonas opera EncuentraTuCoach?",
    a: "La fase actual está enfocada en España con cobertura por ciudad y modalidad online en todo el país.",
  },
] as const;

export const metadata = buildMetadata({
  title: "Sobre EncuentraTuCoach",
  description:
    "Conoce el propósito de EncuentraTuCoach: ayudar a encontrar coach en España con filtros útiles, confianza y contacto directo.",
  path: "/sobre-nosotros",
  keywords: [
    "sobre encuentratucoach",
    "directorio de coaches",
    "encontrar coach en españa",
    "coach online españa",
    "coach certificado",
  ],
});

export default function AboutPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ABOUT_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Sobre EncuentraTuCoach",
    description:
      "Página sobre la misión y propuesta de valor de EncuentraTuCoach para clientes y coaches en España.",
    url: "https://encuentratucoach.es/sobre-nosotros",
    inLanguage: "es",
  };

  return (
    <>
      <JsonLd data={[faqSchema, aboutSchema]} />
      <PageHero
        badge="Sobre la plataforma"
        title="Sobre EncuentraTuCoach"
        description="Un directorio pensado para encontrar coach en España con criterio claro: especialidad, ciudad, modalidad y precio."
      />
      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-950">Nuestra misión</h2>
              <p className="mt-3 text-zinc-700">
                Reducir la fricción entre quien busca acompañamiento y quien ofrece coaching profesional. Por eso
                priorizamos páginas útiles, filtros reales y señales de confianza visibles para que la decisión sea más
                rápida y con mejor encaje.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/coaches"
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Ver directorio
                </Link>
                <Link
                  href="/membresia"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Soy coach: ver membresía
                </Link>
              </div>
            </div>
            <aside className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="text-sm font-black uppercase tracking-wide text-zinc-500">Enfoque</p>
              <ul className="mt-2 grid gap-2 text-sm text-zinc-700">
                <li className="rounded-xl border border-black/10 bg-white px-3 py-2">Búsqueda por intención real</li>
                <li className="rounded-xl border border-black/10 bg-white px-3 py-2">Perfiles comparables</li>
                <li className="rounded-xl border border-black/10 bg-white px-3 py-2">Distintivo certificado</li>
                <li className="rounded-xl border border-black/10 bg-white px-3 py-2">Contacto directo</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Qué resolvemos para clientes</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              <li>Encontrar coach por ciudad y especialidad en menos tiempo.</li>
              <li>Comparar online y presencial con precios orientativos.</li>
              <li>Elegir con más confianza gracias a reseñas y certificación.</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Qué resolvemos para coaches</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              <li>Visibilidad orgánica por ciudad, modalidad y categoría.</li>
              <li>Perfil optimizado para convertir visitas en contactos.</li>
              <li>Modelo sin comisión por lead con membresía fija.</li>
            </ul>
          </article>
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Cómo cuidamos la calidad</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              <li>Arquitectura SEO por intención, no por volumen vacío.</li>
              <li>Reglas anti-thin en landings y combinaciones.</li>
              <li>Moderación de contenido y señalización transparente.</li>
            </ul>
          </article>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-950">Cómo funciona</h2>
              <ol className="mt-3 grid gap-3">
                <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-semibold text-zinc-900">1. Busca por objetivo</p>
                  <p className="mt-1">Selecciona categoría, ciudad, modalidad y rango de precio.</p>
                </li>
                <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-semibold text-zinc-900">2. Compara perfiles</p>
                  <p className="mt-1">Revisa enfoque, experiencia, certificación y reseñas disponibles.</p>
                </li>
                <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
                  <p className="font-semibold text-zinc-900">3. Contacta directo</p>
                  <p className="mt-1">Envía un mensaje claro con objetivo y contexto para avanzar más rápido.</p>
                </li>
              </ol>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-950">Preguntas frecuentes</h2>
              <div className="mt-3 grid gap-3">
                {ABOUT_FAQ.map((item) => (
                  <details key={item.q} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <summary className="cursor-pointer font-semibold text-zinc-900">{item.q}</summary>
                    <p className="mt-2 text-sm text-zinc-700">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Siguiente paso</h2>
          <p className="mt-3 text-zinc-700">
            Si buscas coach, entra al directorio y filtra por encaje. Si eres coach, revisa la membresía para activar
            tu perfil y aparecer en las búsquedas con intención.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/coaches"
              className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Buscar coaches
            </Link>
            <Link
              href="/membresia"
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Ver membresía para coaches
            </Link>
            <Link
              href="/contacto"
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Contacto
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}
