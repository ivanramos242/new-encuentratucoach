import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { filterAndSortCoaches, getCategoryBySlug } from "@/lib/directory";
import { buildMetadata } from "@/lib/seo";

type ParamsInput = Promise<{ categoriaSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug } = await params;
  const category = getCategoryBySlug(categoriaSlug);
  if (!category) {
    return buildMetadata({ title: "Categoría no encontrada", description: "Categoría no encontrada", noindex: true });
  }

  return buildMetadata({
    title: category.name,
    description: `Encuentra ${category.name.toLowerCase()} en España por ciudad, modalidad, certificación y presupuesto.`,
    path: `/coaches/categoria/${category.slug}`,
  });
}

export default async function CategoryLandingPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug } = await params;
  const category = getCategoryBySlug(categoriaSlug);
  if (!category) notFound();

  const items = filterAndSortCoaches({ cat: category.slug, sort: "recent", page: 1 });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${category.name} en España`,
          description: category.shortDescription,
        }}
      />
      <PageHero
        badge="Landing SEO por especialidad"
        title={`${category.name} en España`}
        description={`${category.shortDescription} Compara coaches por ciudad, modalidad y precio.`}
      />
      <PageShell className="pt-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.length ? items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
        </div>
      </PageShell>
    </>
  );
}
