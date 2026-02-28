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

type ParamsInput = Promise<{ ciudadSlug: string }>;

async function getCityLandingData(ciudadSlug: string) {
  const city = getCityBySlug(ciudadSlug);
  if (!city) return null;

  const coaches = await listPublicCoachesMerged();
  const items = coaches.filter((coach) => coach.citySlug === city.slug);
  const minToIndex = getSeoMinCoachesIndexable();
  const noindex = shouldNoIndexLanding({ coachCount: items.length, hasEditorialContent: true });

  const categoryCounts = new Map<string, number>();
  for (const coach of items) {
    for (const categorySlug of coach.categories) {
      categoryCounts.set(categorySlug, (categoryCounts.get(categorySlug) ?? 0) + 1);
    }
  }

  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug, count]) => ({
      slug,
      count,
      name: getCategoryBySlug(slug)?.name ?? slug,
      indexable: count >= minToIndex,
    }));

  return {
    city,
    items,
    noindex,
    minToIndex,
    topCategories,
  };
}

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { ciudadSlug } = await params;
  const data = await getCityLandingData(ciudadSlug);
  if (!data) return buildMetadata({ title: "Ciudad no encontrada", description: "Ciudad no encontrada", noindex: true });

  return buildMetadata({
    title: `Coaching en ${data.city.name}`,
    description: `Encuentra coaches en ${data.city.name} por especialidad, modalidad, certificacion y presupuesto.`,
    path: `/coaches/ciudad/${data.city.slug}`,
    noindex: data.noindex,
  });
}

export default async function CityLandingPage({ params }: { params: ParamsInput }) {
  const { ciudadSlug } = await params;
  const data = await getCityLandingData(ciudadSlug);
  if (!data) notFound();

  const { city, items, noindex, minToIndex, topCategories } = data;
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: `Coaches en ${city.name}`, path: `/coaches/ciudad/${city.slug}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Coaches en ${city.name}`,
    description: `Listado de coaches en ${city.name}.`,
  };

  return (
    <>
      <JsonLd data={[breadcrumb, collectionSchema]} />
      <PageHero
        badge="Landing SEO por ciudad"
        title={`Coaching en ${city.name}`}
        description={`Compara coaches en ${city.name} por especialidad, modalidad, certificacion y precio.`}
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
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Como elegir coach en {city.name}</h2>
          <p className="mt-2 text-zinc-700">
            Define primero tu objetivo (personal, carrera, liderazgo u otro), compara 2-3 perfiles y revisa modalidad,
            precio y certificacion antes de contactar.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Objetivo y especialidad alineados</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Formato online o presencial segun necesidad</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Rango de precio sostenible en el tiempo</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Reseñas y señal de certificacion visibles</li>
          </ul>
        </section>

        {topCategories.length ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Mas buscado en {city.name}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/coaches/categoria/${category.slug}/${city.slug}`}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white"
                >
                  <p className="font-semibold text-zinc-900">{category.name}</p>
                  <p className="mt-1 text-xs text-zinc-600">{category.count} perfiles en esta combinacion</p>
                  {!category.indexable ? (
                    <p className="mt-1 text-xs font-semibold text-amber-700">Combinacion noindex por cobertura baja</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="sr-only">Listado de coaches en {city.name}</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.length ? items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
          </div>
        </section>
      </PageShell>
    </>
  );
}
