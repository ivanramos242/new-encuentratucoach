import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { filterAndSortCoachesFrom, getCityBySlug } from "@/lib/directory";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { buildMetadata } from "@/lib/seo";

type ParamsInput = Promise<{ ciudadSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { ciudadSlug } = await params;
  const city = getCityBySlug(ciudadSlug);
  if (!city) return buildMetadata({ title: "Ciudad no encontrada", description: "Ciudad no encontrada", noindex: true });
  return buildMetadata({
    title: `Coaches en ${city.name}`,
    description: `Encuentra coaches en ${city.name} por especialidad, modalidad, certificación y presupuesto.`,
    path: `/coaches/ciudad/${city.slug}`,
  });
}

export default async function CityLandingPage({ params }: { params: ParamsInput }) {
  const { ciudadSlug } = await params;
  const city = getCityBySlug(ciudadSlug);
  if (!city) notFound();

  const items = filterAndSortCoachesFrom(await listPublicCoachesMerged(), { location: city.slug, sort: "recent", page: 1 });

  return (
    <>
      <PageHero
        badge="Landing SEO por ciudad"
        title={`Coaches en ${city.name}`}
        description={`Explora coaches en ${city.name} y filtra por modalidad, certificación y presupuesto.`}
      />
      <PageShell className="pt-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.length ? items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
        </div>
      </PageShell>
    </>
  );
}
