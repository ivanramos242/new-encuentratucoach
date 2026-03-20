import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildArticleSchema, buildBreadcrumbList, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Plataformas para trabajar como coach: cómo elegir (2026)",
  description:
    "Checklist para elegir plataforma: visibilidad SEO, leads, reglas y retorno. Comparativa y pasos.",
  path: "/plataformas-para-trabajar-como-coach",
});

export default function PlatformsGuidePage() {
  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbList([
            { name: "Inicio", path: "/" },
            {
              name: "Plataformas para trabajar como coach",
              path: "/plataformas-para-trabajar-como-coach",
            },
          ]),
          buildArticleSchema({
            headline: "Plataformas para trabajar como coach: cómo elegir (2026)",
            description:
              "Checklist para elegir plataforma: visibilidad SEO, leads, reglas y retorno. Comparativa y pasos.",
            path: "/plataformas-para-trabajar-como-coach",
            authorName: "EncuentraTuCoach",
          }),
        ]}
      />
      <PageHero
        badge="Guía B2B"
        title="Plataformas para trabajar como coach"
        description="Qué mirar antes de pagar una membresía: visibilidad real, intención del tráfico, reglas, métricas y retorno."
      />
      <PageShell className="pt-8">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Checklist de evaluación</h2>
          <div className="mt-4 grid gap-3">
            <GuideCard title="1. Visibilidad SEO real" text="Si la plataforma no posiciona landings y perfiles, pagar no te compra demanda." />
            <GuideCard title="2. Intención y calidad del lead" text="No solo importa el volumen. Importa aparecer en búsquedas con intención real de contratar." />
            <GuideCard title="3. Reglas y dependencia" text="Revisa si controlas tu perfil, tus reseñas y tu visibilidad o dependes por completo del portal." />
            <GuideCard title="4. Métricas y conversión" text="Necesitas saber vistas, clics y mensajes, no solo una promesa difusa de exposición." />
          </div>
        </article>

        <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Qué debería darte una membresía útil</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">
            <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">Perfil canónico e indexable con opción de captar tráfico local y por especialidad.</li>
            <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">Señales de confianza visibles para mejorar conversión desde la primera visita.</li>
            <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">Datos básicos de rendimiento para decidir si sigues, optimizas o cancelas.</li>
          </ul>
        </section>

        <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Siguiente paso</h2>
          <p className="mt-3 leading-7 text-zinc-700">
            Si quieres visibilidad con rutas limpias, perfiles preparados para convertir y métricas básicas para entender retorno, la membresía es el siguiente paso lógico.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/membresia" className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
              Ver membresía
            </Link>
            <Link href="/coaches" className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
              Ver directorio público
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}

function GuideCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
      <h3 className="text-sm font-black tracking-tight text-zinc-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p>
    </div>
  );
}
