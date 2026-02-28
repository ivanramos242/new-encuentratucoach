import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Como conseguir clientes como coach",
  description:
    "Ruta practica para coaches: posicionamiento por nicho, perfil de alta conversion, reseñas y sistema de captacion sostenido.",
  path: "/conseguir-clientes-como-coach",
});

export default function GetClientsAsCoachPage() {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Como conseguir clientes como coach", path: "/conseguir-clientes-como-coach" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PageHero
        badge="Guia B2B accionable"
        title="Como conseguir clientes como coach"
        description="Plan de 90 dias para pasar de perfil invisible a flujo constante de leads con intencion."
      />
      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Plan en 4 pasos</h2>
          <ol className="mt-4 grid gap-3 text-sm text-zinc-700">
            <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <strong>Paso 1:</strong> define nicho y promesa en una frase (tipo de coaching + problema + resultado).
            </li>
            <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <strong>Paso 2:</strong> construye perfil orientado a conversion (bio, metodologia, oferta y CTA).
            </li>
            <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <strong>Paso 3:</strong> capta prueba social con reseñas verificables y casos concretos.
            </li>
            <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <strong>Paso 4:</strong> mide semanalmente visitas, clics de contacto y ratio a lead.
            </li>
          </ol>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Errores frecuentes</h2>
          <ul className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Perfil sin enfoque de especialidad</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Sin propuesta de valor clara ni CTA directo</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">No trabajar reseñas ni señal de confianza</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">No revisar metricas y conversion por ciudad/categoria</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Activa tu perfil con membresia</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Publica tu perfil, aparece en landings SEO y recibe leads directos sin comisiones por contacto.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/membresia" className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Ver membresia
            </Link>
            <Link
              href="/plataformas-para-trabajar-como-coach"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              Comparar plataformas
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}
