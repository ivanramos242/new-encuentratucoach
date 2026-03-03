import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { FaqCompact } from "@/components/directory/faq-compact";
import { LandingSection } from "@/components/directory/landing-section";
import { LandingShell } from "@/components/directory/landing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategoryBySlug } from "@/lib/directory";
import { getCategorySeoContent } from "@/lib/landing-content";
import {
  buildCategoryContextLinks,
  buildExploreCardsForCategory,
  topCityItems,
} from "@/lib/landing-view-models";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { buildBreadcrumbJsonLd, buildMetadata, shouldNoIndexLanding } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

type ParamsInput = Promise<{ categoriaSlug: string }>;

async function getCategoryLandingData(categoriaSlug: string) {
  const category = getCategoryBySlug(categoriaSlug);
  if (!category) return null;

  const coaches = await listPublicCoachesMerged();
  const items = coaches.filter((coach) => coach.categories.includes(category.slug));
  const noindex = shouldNoIndexLanding({ coachCount: items.length, hasEditorialContent: true });
  const seo = getCategorySeoContent(category);
  const topCities = topCityItems(items, 6);
  const contextLinks = buildCategoryContextLinks(category.slug, topCities);
  const exploreCards = buildExploreCardsForCategory(category.slug, topCities);

  return {
    category,
    seo,
    items,
    noindex,
    contextLinks,
    exploreCards,
  };
}

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug } = await params;
  const data = await getCategoryLandingData(categoriaSlug);
  if (!data) return buildMetadata({ title: "Categoria no encontrada", description: "Categoria no encontrada", noindex: true });

  return buildMetadata({
    title: data.seo.title,
    description: data.seo.metaDescription,
    path: `/coaches/categoria/${data.category.slug}`,
    noindex: data.noindex,
    keywords: data.seo.keywords,
  });
}

export default async function CategoryLandingPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug } = await params;
  const data = await getCategoryLandingData(categoriaSlug);
  if (!data) notFound();

  const { category, seo, items, contextLinks, exploreCards } = data;
  const baseUrl = getSiteBaseUrl();

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: category.name, path: `/coaches/categoria/${category.slug}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.title,
    description: seo.metaDescription,
    url: `${baseUrl}/coaches/categoria/${category.slug}`,
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
        contextTitle={`Atajos para ${category.name.toLowerCase()}`}
        contextDescription="Navega por ciudades donde esta especialidad tiene mas oferta."
        contextLinks={contextLinks}
      >
        <LandingSection
          title={`${items.length} ${items.length === 1 ? "coach" : "coaches"} de ${category.name.toLowerCase()}`}
          description="Abre perfiles, compara enfoque y formato de sesion, y contacta con quienes mejor encajen con tu objetivo."
        >
          {items.length ? (
            <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-black/10 bg-zinc-50 p-5">
              <p className="text-sm text-zinc-700">Todavia no hay perfiles activos para esta especialidad.</p>
              <div className="mt-3">
                <Link
                  href="/coaches"
                  className="inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Volver al directorio
                </Link>
              </div>
            </div>
          )}
        </LandingSection>

        {exploreCards.length ? (
          <LandingSection
            title={`Ciudades clave para ${category.name.toLowerCase()}`}
            description="Consulta primero las ciudades con mas perfiles en esta especialidad."
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
