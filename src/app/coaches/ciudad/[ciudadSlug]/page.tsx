import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { FaqCompact } from "@/components/directory/faq-compact";
import { LandingRealisticContent } from "@/components/directory/landing-realistic-content";
import { LandingSection } from "@/components/directory/landing-section";
import { LandingShell } from "@/components/directory/landing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getCityBySlug } from "@/lib/directory";
import { getCitySeoContent } from "@/lib/landing-content";
import { isPriorityLanding } from "@/lib/landing-realism";
import {
  buildCityContextLinks,
  buildExploreCardsForCity,
  topCategoryItems,
} from "@/lib/landing-view-models";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { getTrustMetricsForCoachSet } from "@/lib/directory-trust-metrics";
import { buildBreadcrumbJsonLd, buildMetadata, shouldNoIndexLanding } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

type ParamsInput = Promise<{ ciudadSlug: string }>;

async function getCityLandingData(ciudadSlug: string) {
  const city = getCityBySlug(ciudadSlug);
  if (!city) return null;

  const coaches = await listPublicCoachesMerged();
  const items = coaches.filter((coach) => coach.citySlug === city.slug);
  const noindex = shouldNoIndexLanding({ coachCount: items.length, hasEditorialContent: true });
  const priority = isPriorityLanding({ kind: "city", citySlug: city.slug, allCoaches: coaches });
  const seo = getCitySeoContent(city.slug, city.name);
  const topCategories = topCategoryItems(items, 6);
  const contextLinks = buildCityContextLinks(city.slug, topCategories);
  const exploreCards = buildExploreCardsForCity(city.slug, topCategories);
  const trustStats = await getTrustMetricsForCoachSet({
    coachIds: items.map((coach) => coach.id),
    fallbackCoaches: items,
  });

  return {
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
  const { ciudadSlug } = await params;
  const data = await getCityLandingData(ciudadSlug);
  if (!data) return buildMetadata({ title: "Ciudad no encontrada", description: "Ciudad no encontrada", noindex: true });

  return buildMetadata({
    title: data.seo.title,
    description: data.seo.metaDescription,
    path: `/coaches/ciudad/${data.city.slug}`,
    noindex: data.noindex,
    keywords: data.seo.keywords,
  });
}

export default async function CityLandingPage({ params }: { params: ParamsInput }) {
  const { ciudadSlug } = await params;
  const data = await getCityLandingData(ciudadSlug);
  if (!data) notFound();

  const { city, seo, items, priority, contextLinks, exploreCards, trustStats } = data;
  const isPrimaryCity = city.slug === "madrid" || city.slug === "barcelona";
  const baseUrl = getSiteBaseUrl();

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: `Coaches en ${city.name}`, path: `/coaches/ciudad/${city.slug}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.title,
    description: seo.metaDescription,
    url: `${baseUrl}/coaches/ciudad/${city.slug}`,
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
        compactHero={isPrimaryCity}
        contextTitle={isPrimaryCity ? `Rutas rapidas en ${city.name}` : `Atajos para buscar en ${city.name}`}
        contextDescription={
          isPrimaryCity
            ? `Filtra por especialidad y presupuesto para llegar antes a perfiles con encaje real en ${city.name}.`
            : "Empieza por rutas utiles y reduce el tiempo de comparacion."
        }
        contextLinks={contextLinks}
        trustStats={trustStats}
      >
        <LandingSection
          title={
            isPrimaryCity
              ? `${items.length} ${items.length === 1 ? "coach disponible" : "coaches disponibles"} en ${city.name}`
              : `${items.length} ${items.length === 1 ? "coach" : "coaches"} en ${city.name}`
          }
          description={
            isPrimaryCity
              ? `Seleccion de perfiles en ${city.name} para comparar enfoque, modalidad y precio sin saturacion visual.`
              : "Compara perfiles por enfoque, modalidad y precio. Revisa fichas y contacta solo con los que encajen contigo."
          }
        >
          {items.length ? (
            <div
              className={
                isPrimaryCity
                  ? "mt-5 grid gap-5 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3"
                  : "mt-5 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3"
              }
            >
              {items.map((coach) => (
                <CoachCard key={coach.id} coach={coach} density={isPrimaryCity ? "airy" : "default"} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-black/10 bg-zinc-50 p-5">
              <p className="text-sm text-zinc-700">Todavia no hay perfiles activos en esta ciudad.</p>
              <div className="mt-3">
                <Link
                  href="/coaches"
                  className="inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Ver todo el directorio
                </Link>
              </div>
            </div>
          )}
        </LandingSection>

        <LandingRealisticContent kind="city" items={items} city={city} priority={priority} />

        {exploreCards.length ? (
          <LandingSection
            title={isPrimaryCity ? `Especialidades destacadas en ${city.name}` : `Explora especialidades en ${city.name}`}
            description={
              isPrimaryCity
                ? "Entrar por especialidad te ayuda a reducir ruido y comparar mejor desde el inicio."
                : "Si tu objetivo esta claro, entrar por especialidad te ayuda a decidir mas rapido."
            }
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

        <FaqCompact title={`Preguntas frecuentes sobre coaching en ${city.name}`} items={seo.faq} />
      </LandingShell>
    </>
  );
}
