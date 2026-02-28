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

type ParamsInput = Promise<{ categoriaSlug: string; ciudadSlug: string }>;

async function getCategoryCityLandingData(categoriaSlug: string, ciudadSlug: string) {
  const category = getCategoryBySlug(categoriaSlug);
  const city = getCityBySlug(ciudadSlug);
  if (!category || !city) return null;

  const coaches = await listPublicCoachesMerged();
  const items = coaches.filter(
    (coach) => coach.categories.includes(category.slug) && coach.citySlug === city.slug,
  );

  const minToIndex = getSeoMinCoachesIndexable();
  const noindex = shouldNoIndexLanding({ coachCount: items.length, hasEditorialContent: true });

  return { category, city, items, noindex, minToIndex };
}

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug, ciudadSlug } = await params;
  const data = await getCategoryCityLandingData(categoriaSlug, ciudadSlug);
  if (!data) {
    return buildMetadata({ title: "Landing no encontrada", description: "Landing no encontrada", noindex: true });
  }

  return buildMetadata({
    title: `${data.category.name} en ${data.city.name}`,
    description: `Encuentra ${data.category.name.toLowerCase()} en ${data.city.name}.`,
    path: `/coaches/categoria/${data.category.slug}/${data.city.slug}`,
    noindex: data.noindex,
  });
}

export default async function CategoryCityLandingPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug, ciudadSlug } = await params;
  const data = await getCategoryCityLandingData(categoriaSlug, ciudadSlug);
  if (!data) notFound();

  const { category, city, items, noindex, minToIndex } = data;
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: category.name, path: `/coaches/categoria/${category.slug}` },
    { name: `${category.name} en ${city.name}`, path: `/coaches/categoria/${category.slug}/${city.slug}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} en ${city.name}`,
    description: `Listado de coaches de ${category.name.toLowerCase()} en ${city.name}.`,
  };

  return (
    <>
      <JsonLd data={[breadcrumb, collectionSchema]} />
      <PageHero
        badge="Landing SEO curada"
        title={`${category.name} en ${city.name}`}
        description={`Compara perfiles por precio, modalidad y certificacion para ${category.name.toLowerCase()} en ${city.name}.`}
      />
      <PageShell className="space-y-6 pt-8">
        {noindex ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Esta combinacion todavia no se indexa porque tiene menos de {minToIndex} coaches disponibles.
            <div className="mt-2 flex flex-wrap gap-4">
              <Link href={`/coaches/categoria/${category.slug}`} className="font-semibold underline">
                Ver categoria completa
              </Link>
              <Link href={`/coaches/ciudad/${city.slug}`} className="font-semibold underline">
                Ver coaches en {city.name}
              </Link>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Que esperar de esta busqueda</h2>
          <p className="mt-2 text-zinc-700">
            Esta landing combina intencion local y especialidad para encontrar perfiles con mayor encaje. Revisa
            metodologia, formato y reseñas antes de contactar.
          </p>
        </section>

        <section>
          <h2 className="sr-only">
            Listado de {category.name.toLowerCase()} en {city.name}
          </h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.length ? items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
          </div>
        </section>
      </PageShell>
    </>
  );
}
