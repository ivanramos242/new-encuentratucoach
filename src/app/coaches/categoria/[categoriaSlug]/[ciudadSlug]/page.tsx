import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { FaqCompact } from "@/components/directory/faq-compact";
import { LandingRealisticContent } from "@/components/directory/landing-realistic-content";
import { LandingSection } from "@/components/directory/landing-section";
import { LandingShell } from "@/components/directory/landing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategoryBySlug, getCityBySlug, resolveCitySlug } from "@/lib/directory";
import { getCategoryCitySeoContent } from "@/lib/landing-content";
import { isPriorityLanding } from "@/lib/landing-realism";
import {
  buildCategoryCityContextLinks,
  buildExploreCardsForCategory,
  topCityItems,
} from "@/lib/landing-view-models";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { getTrustMetricsForCoachSet } from "@/lib/directory-trust-metrics";
import { buildBreadcrumbJsonLd, buildMetadata, shouldNoIndexLanding } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

type ParamsInput = Promise<{ categoriaSlug: string; ciudadSlug: string }>;

async function getCategoryCityLandingData(categoriaSlug: string, ciudadSlug: string) {
  const category = getCategoryBySlug(categoriaSlug);
  const city = getCityBySlug(ciudadSlug);
  if (!category || !city) return null;

  const coaches = await listPublicCoachesMerged();
  const items = coaches.filter(
    (coach) => coach.categories.includes(category.slug) && resolveCitySlug(coach.citySlug) === city.slug,
  );
  const noindex = shouldNoIndexLanding({ coachCount: items.length, hasEditorialContent: true });
  const priority = isPriorityLanding({
    kind: "category_city",
    categorySlug: category.slug,
    citySlug: city.slug,
    allCoaches: coaches,
  });
  const seo = getCategoryCitySeoContent(category.slug, city.slug, category.name, city.name);

  const sameCategoryAllCities = coaches.filter((coach) => coach.categories.includes(category.slug));
  const otherCities = topCityItems(
    sameCategoryAllCities.filter((coach) => resolveCitySlug(coach.citySlug) !== city.slug),
    6,
  );

  const contextLinks = buildCategoryCityContextLinks(category.slug, city.slug, city.name);
  const exploreCards = buildExploreCardsForCategory(category.slug, otherCities);
  const trustStats = await getTrustMetricsForCoachSet({
    coachIds: items.map((coach) => coach.id),
    fallbackCoaches: items,
  });

  return {
    category,
    city,
    seo,
    items,
    noindex,
    priority,
    contextLinks,
    exploreCards,
    trustStats,
  };
}

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug, ciudadSlug } = await params;
  const data = await getCategoryCityLandingData(categoriaSlug, ciudadSlug);
  if (!data) return buildMetadata({ title: "Landing no encontrada", description: "Landing no encontrada", noindex: true });

  return buildMetadata({
    title: data.seo.title,
    description: data.seo.metaDescription,
    path: `/coaches/categoria/${data.category.slug}/${data.city.slug}`,
    noindex: data.noindex,
    keywords: data.seo.keywords,
  });
}

export default async function CategoryCityLandingPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug, ciudadSlug } = await params;
  const data = await getCategoryCityLandingData(categoriaSlug, ciudadSlug);
  if (!data) notFound();

  const { category, city, seo, items, priority, contextLinks, exploreCards, trustStats } = data;
  const baseUrl = getSiteBaseUrl();

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: category.name, path: `/coaches/categoria/${category.slug}` },
    { name: `${category.name} en ${city.name}`, path: `/coaches/categoria/${category.slug}/${city.slug}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.title,
    description: seo.metaDescription,
    url: `${baseUrl}/coaches/categoria/${category.slug}/${city.slug}`,
    keywords: seo.keywords.join(", "),
  };

  const faqSchema =
    seo.faq.length >= 2
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: seo.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

  return (
    <>
      <JsonLd data={faqSchema ? [breadcrumb, collectionSchema, faqSchema] : [breadcrumb, collectionSchema]} />
      <LandingShell
        hero={seo.hero}
        contextTitle="Navegacion rapida"
        contextDescription="Pasa de esta combinacion concreta a otras rutas relacionadas en un clic."
        contextLinks={contextLinks}
        trustStats={trustStats}
      >
        <LandingSection
          title={`${items.length} ${items.length === 1 ? "coach" : "coaches"} de ${category.name.toLowerCase()} en ${city.name}`}
          description="Estos perfiles trabajan esta especialidad en tu ciudad. Revisa encaje y metodo antes de contactar."
        >
          {items.length ? (
            <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-black/10 bg-zinc-50 p-5">
              <p className="text-sm text-zinc-700">No hay perfiles activos para esta combinacion por ahora.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/coaches/categoria/${category.slug}`}
                  className="inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Ver esta categoria en España
                </Link>
                <Link
                  href={`/coaches/ciudad/${city.slug}`}
                  className="inline-flex rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Ver todos en {city.name}
                </Link>
              </div>
            </div>
          )}
        </LandingSection>

        <LandingRealisticContent
          kind="category_city"
          items={items}
          city={city}
          category={category}
          priority={priority}
        />

        {exploreCards.length ? (
          <LandingSection
            title={`${category.name} en otras ciudades`}
            description="Si no encuentras el encaje ideal aqui, compara la misma especialidad en otras plazas relevantes."
          >
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
              {exploreCards.map((card) => (
                <Link
                  key={`${card.title}-${card.href}`}
                  href={card.href}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-3.5 hover:bg-white sm:p-4"
                >
                  <p className="font-semibold text-zinc-900">{card.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{card.description}</p>
                  <p className="mt-3 text-xs font-semibold text-zinc-900">{card.ctaLabel ?? "Ver mas"}</p>
                </Link>
              ))}
            </div>
          </LandingSection>
        ) : null}

        <FaqCompact title="Preguntas frecuentes" items={seo.faq} />
      </LandingShell>
    </>
  );
}
