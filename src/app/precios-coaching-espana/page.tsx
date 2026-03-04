import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Precios de coaching en España",
  description:
    "Rangos orientativos de precios de coaching en España por especialidad, formato online/presencial y experiencia del coach.",
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
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Precios de coaching en España", path: "/precios-coaching-espana" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PageHero
        badge="Guía de precios"
        title="Precios de coaching en España (guía realista)"
        description="Qué influye en el precio por sesión, rangos habituales y cómo comparar propuestas sin pagar de más."
      />

      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Rangos orientativos por sesión</h2>
          <ul className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Coaching personal: 60€ - 120€</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Coaching de carrera: 70€ - 140€</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Coaching de liderazgo: 90€ - 220€</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Coaching ejecutivo: 120€ - 300€</li>
          </ul>
          <p className="mt-3 text-xs text-zinc-600">
            Rangos informativos: cada coach define su tarifa según experiencia, nicho y formato de sesión.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Cómo comparar precios con criterio</h2>
          <ol className="mt-4 grid gap-2 text-sm text-zinc-700">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">1. Define objetivo y plazo esperado.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">2. Compara especialidad real y metodología.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">3. Revisa modalidad (online/presencial) y frecuencia.</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">4. Valora señales de confianza: certificación y reseñas.</li>
          </ol>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Compara coaches ahora</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/coaches" className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Ver directorio
            </Link>
            <Link href="/coaches/modalidad/online" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
              Coaching online
            </Link>
            <Link href="/coaches/ciudad/madrid" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
              Coaches en Madrid
            </Link>
            <Link href="/coaches/certificados" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
              Coaches certificados
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}
