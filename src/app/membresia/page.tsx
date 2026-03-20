import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbList, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Membresía para coaches: visibilidad, clientes y métricas",
  description:
    "Activa tu perfil, aparece en búsquedas con intención real y mejora conversión con métricas.",
  path: "/membresia",
});

const plans = [
  {
    id: "monthly",
    name: "Plan mensual",
    price: "29€/mes",
    description: "Ideal para validar la plataforma y empezar a recibir visibilidad.",
    features: ["Perfil público activo", "SEO en directorio", "Reseñas y certificación", "Métricas básicas V1"],
  },
  {
    id: "annual",
    name: "Plan anual",
    price: "290€/año",
    description: "Mejor coste anual para coaches que quieren continuidad y posicionamiento.",
    features: ["Todo lo del plan mensual", "Ahorro anual", "Prioridad en mejoras", "Preparado para futuras funciones premium"],
    highlighted: true,
  },
];

export default function MembershipPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Inicio", path: "/" },
          { name: "Membresía", path: "/membresia" },
        ])}
      />
      <PageHero
        badge="Visibilidad + captación"
        title="Membresía para coaches"
        description="Activa tu perfil, aparece en búsquedas con intención real y entiende mejor tu conversión con métricas básicas."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <section
              key={plan.id}
              className={
                plan.highlighted
                  ? "rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-sm"
                  : "rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              }
            >
              <h2 className="text-2xl font-black tracking-tight text-zinc-950">{plan.name}</h2>
              <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{plan.price}</p>
              <p className="mt-3 text-zinc-700">{plan.description}</p>
              <ul className="mt-5 grid gap-2 text-sm text-zinc-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="rounded-xl border border-black/10 bg-white/80 px-3 py-2">
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/registro/coach"
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Crear cuenta de coach
                </Link>
                <Link
                  href="/plataformas-para-trabajar-como-coach"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Ver la guía
                </Link>
              </div>
            </section>
          ))}
        </div>
      </PageShell>
    </>
  );
}
