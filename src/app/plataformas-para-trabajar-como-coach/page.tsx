import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Plataformas para trabajar como coach",
  description:
    "Comparativa practica de plataformas para coaches: criterios de visibilidad, calidad de leads y coste real de captacion.",
  path: "/plataformas-para-trabajar-como-coach",
});

export default function PlatformsForCoachesPage() {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Plataformas para trabajar como coach", path: "/plataformas-para-trabajar-como-coach" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PageHero
        badge="Guia B2B para coaches"
        title="Plataformas para trabajar como coach"
        description="Que evaluar antes de pagar una membresia: visibilidad SEO, calidad del lead, reglas de contacto y retorno esperado."
      />
      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Criterios que importan de verdad</h2>
          <ul className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
            <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4">Intencion del trafico: busquedas transaccionales, no solo volumen.</li>
            <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4">Modelo de negocio claro: cuota fija vs comision por contacto.</li>
            <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4">Señales de confianza: reseñas, certificacion y perfil completo.</li>
            <li className="rounded-2xl border border-black/10 bg-zinc-50 p-4">Capacidad de medicion: visitas, clics y tiempo a primer lead.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Checklist rapido de decision</h2>
          <ol className="mt-4 grid gap-2 text-sm text-zinc-700">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">1. Define tu nicho principal y ciudad objetivo.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">2. Estima coste por lead con un horizonte minimo de 90 dias.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">3. Revisa si puedes rankear por especialidad y ciudad dentro de la plataforma.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">4. Exige trazabilidad de resultados antes de escalar inversion.</li>
          </ol>
        </section>

        <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Explora la membresia de EncuentraTuCoach</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Modelo de cuota fija sin comisiones por contacto, perfil SEO y visibilidad en landings por ciudad y especialidad.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/membresia" className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Ver membresia
            </Link>
            <Link
              href="/conseguir-clientes-como-coach"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              Como conseguir clientes
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}
