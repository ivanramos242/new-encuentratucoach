import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { filterAndSortCoachesFrom, getCategoryBySlug, getCityBySlug } from "@/lib/directory";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { buildMetadata } from "@/lib/seo";

type ParamsInput = Promise<{ categoriaSlug: string; ciudadSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug, ciudadSlug } = await params;
  const category = getCategoryBySlug(categoriaSlug);
  const city = getCityBySlug(ciudadSlug);
  if (!category || !city) {
    return buildMetadata({ title: "Landing no encontrada", description: "Landing no encontrada", noindex: true });
  }

  return buildMetadata({
    title: `${category.name} en ${city.name}`,
    description: `Encuentra ${category.name.toLowerCase()} en ${city.name}. Landing indexable categoría + ciudad.`,
    path: `/coaches/categoria/${category.slug}/${city.slug}`,
  });
}

export default async function CategoryCityLandingPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug, ciudadSlug } = await params;
  const category = getCategoryBySlug(categoriaSlug);
  const city = getCityBySlug(ciudadSlug);
  if (!category || !city) notFound();

  const items = filterAndSortCoachesFrom(await listPublicCoachesMerged(), {
    cat: category.slug,
    location: city.slug,
    sort: "recent",
    page: 1,
  });

  return (
    <>
      <PageHero
        badge="Landing SEO curada"
        title={`${category.name} en ${city.name}`}
        description={`Compara perfiles de ${category.name.toLowerCase()} en ${city.name} por precio, modalidad y certificación.`}
      />
      <PageShell className="pt-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.length ? items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
        </div>
      </PageShell>
    </>
  );
}
