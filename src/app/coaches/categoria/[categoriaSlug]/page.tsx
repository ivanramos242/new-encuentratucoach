import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategoryBySlug, getCityBySlug } from "@/lib/directory";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import {
  buildBreadcrumbJsonLd,
  buildMetadata,
  getSeoMinCoachesIndexable,
  shouldNoIndexLanding,
} from "@/lib/seo";

type ParamsInput = Promise<{ categoriaSlug: string }>;

async function getCategoryLandingData(categoriaSlug: string) {
  const category = getCategoryBySlug(categoriaSlug);
  if (!category) return null;

  const coaches = await listPublicCoachesMerged();
  const items = coaches.filter((coach) => coach.categories.includes(category.slug));
  const minToIndex = getSeoMinCoachesIndexable();
  const noindex = shouldNoIndexLanding({ coachCount: items.length, hasEditorialContent: true });

  const cityCounts = new Map<string, number>();
  for (const coach of items) {
    cityCounts.set(coach.citySlug, (cityCounts.get(coach.citySlug) ?? 0) + 1);
  }

  const topCities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([slug, count]) => ({
      slug,
      count,
      cityName: getCityBySlug(slug)?.name ?? slug,
      indexable: count >= minToIndex,
    }));

  return {
    category,
    items,
    noindex,
    minToIndex,
    topCities,
  };
}

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug } = await params;
  const data = await getCategoryLandingData(categoriaSlug);
  if (!data) {
    return buildMetadata({ title: "Categoria no encontrada", description: "Categoria no encontrada", noindex: true });
  }

  return buildMetadata({
    title: `${data.category.name} en España`,
    description: `Encuentra ${data.category.name.toLowerCase()} por ciudad, modalidad, certificacion y presupuesto.`,
    path: `/coaches/categoria/${data.category.slug}`,
    noindex: data.noindex,
  });
}

export default async function CategoryLandingPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug } = await params;
  const data = await getCategoryLandingData(categoriaSlug);
  if (!data) notFound();

  const { category, items, noindex, minToIndex, topCities } = data;

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: category.name, path: `/coaches/categoria/${category.slug}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} en España`,
    description: category.shortDescription,
  };

  return (
    <>
      <JsonLd data={[breadcrumb, collectionSchema]} />
      <PageHero
        badge="Landing SEO por especialidad"
        title={`${category.name} en España`}
        description={`${category.shortDescription} Compara coaches por ciudad, modalidad y precio.`}
      />
      <PageShell className="space-y-6 pt-8">
        {noindex ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Esta landing no se indexa todavia porque tiene menos de {minToIndex} coaches publicados.
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/coaches" className="font-semibold underline">
                Ir al directorio general
              </Link>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Que hace un coach de {category.name.toLowerCase()}</h2>
          <p className="mt-2 text-zinc-700">
            Este tipo de coaching trabaja objetivos concretos con sesiones estructuradas, seguimiento y plan de accion.
            Antes de decidir, compara metodologia, experiencia y encaje personal.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Definir objetivo y metricas claras</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Evaluar experiencia en casos similares</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Alinear formato, duracion y frecuencia</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Revisar precio y condiciones de trabajo</li>
          </ul>
        </section>

        {topCities.length ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">
              Ciudades top para {category.name.toLowerCase()}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/coaches/categoria/${category.slug}/${city.slug}`}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white"
                >
                  <p className="font-semibold text-zinc-900">{city.cityName}</p>
                  <p className="mt-1 text-xs text-zinc-600">{city.count} perfiles en esta combinacion</p>
                  {!city.indexable ? (
                    <p className="mt-1 text-xs font-semibold text-amber-700">Combinacion noindex por cobertura baja</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="sr-only">Listado de coaches de {category.name}</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.length ? items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
          </div>
        </section>
      </PageShell>
    </>
  );
}
