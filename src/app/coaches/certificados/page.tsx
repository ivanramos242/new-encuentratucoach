import Link from "next/link";
import { type Metadata } from "next";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategoryBySlug, getCityBySlug } from "@/lib/directory";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { buildBreadcrumbJsonLd, buildMetadata, shouldNoIndexLanding } from "@/lib/seo";

async function getCertifiedLandingData() {
  const coaches = await listPublicCoachesMerged();
  const items = coaches.filter((coach) => coach.certifiedStatus === "approved");
  const noindex = shouldNoIndexLanding({ coachCount: items.length, hasEditorialContent: true });

  const topCategories = Array.from(
    items.reduce((acc, coach) => {
      for (const categorySlug of coach.categories) {
        acc.set(categorySlug, (acc.get(categorySlug) ?? 0) + 1);
      }
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug]) => ({ slug, name: getCategoryBySlug(slug)?.name ?? slug }));

  const topCities = Array.from(
    items.reduce((acc, coach) => {
      acc.set(coach.citySlug, (acc.get(coach.citySlug) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug]) => ({ slug, name: getCityBySlug(slug)?.name ?? slug }));

  return { items, noindex, topCategories, topCities };
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getCertifiedLandingData();
  return buildMetadata({
    title: "Coaches certificados en España",
    description: "Encuentra coaches certificados en España y compara perfiles por especialidad, ciudad y modalidad.",
    path: "/coaches/certificados",
    noindex: data.noindex,
  });
}

export default async function CertifiedCoachesPage() {
  const data = await getCertifiedLandingData();
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: "Coaches certificados", path: "/coaches/certificados" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PageHero
        badge="Confianza"
        title="Coaches certificados en España"
        description="Perfiles con certificación visible para comparar opciones con más confianza."
      />
      <PageShell className="space-y-8 pt-8" containerClassName="max-w-[1700px]">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Qué significa coach certificado</h2>
          <p className="mt-2 text-zinc-700">
            El distintivo identifica perfiles que han presentado documentación y han pasado revisión dentro de la
            plataforma. Es una señal de confianza adicional, no la única.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Certificación visible en ficha de coach</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Comparativa por especialidad y ciudad</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Compatibilidad online y presencial</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Revisión de reseñas y propuesta de valor</li>
          </ul>
        </section>

        {data.topCategories.length ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Especialidades con coaches certificados</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.topCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/coaches/categoria/${category.slug}`}
                  className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {data.topCities.length ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Ciudades con mayor oferta certificada</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.topCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/coaches/ciudad/${city.slug}`}
                  className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="sr-only">Listado de coaches certificados</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {data.items.length ? data.items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
          </div>
        </section>
      </PageShell>
    </>
  );
}
