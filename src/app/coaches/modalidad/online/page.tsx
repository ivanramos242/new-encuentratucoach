import Link from "next/link";
import type { Metadata } from "next";
import { CoachCard } from "@/components/directory/coach-card";
import { FaqCompact } from "@/components/directory/faq-compact";
import { LandingSection } from "@/components/directory/landing-section";
import { LandingShell } from "@/components/directory/landing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import type { LandingContextLink } from "@/lib/landing-content";
import { getOnlineSeoContent } from "@/lib/landing-content";
import { buildExploreCardsForOnline, topCategoryItems, topCityItems } from "@/lib/landing-view-models";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { getTrustMetricsForCoachSet } from "@/lib/directory-trust-metrics";
import { buildBreadcrumbJsonLd, buildMetadata, shouldNoIndexLanding } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";

async function getOnlineLandingData() {
  const coaches = await listPublicCoachesMerged();
  const items = coaches.filter((coach) => coach.sessionModes.includes("online"));
  const noindex = shouldNoIndexLanding({ coachCount: items.length, hasEditorialContent: true });
  const seo = getOnlineSeoContent();
  const topCategories = topCategoryItems(items, 6);
  const topCities = topCityItems(items, 3);
  const exploreCards = buildExploreCardsForOnline(topCategories);
  const trustStats = await getTrustMetricsForCoachSet({
    coachIds: items.map((coach) => coach.id),
    fallbackCoaches: items,
  });

  const contextLinks: LandingContextLink[] = [
    { label: "Todos los coaches", href: "/coaches" },
    { label: "Coaches certificados", href: "/coaches/certificados" },
    ...topCities.map((city) => ({ label: city.label, href: `/coaches/ciudad/${city.slug}` })),
  ].slice(0, 6);

  return { items, noindex, seo, contextLinks, exploreCards, trustStats };
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getOnlineLandingData();
  return buildMetadata({
    title: data.seo.title,
    description: data.seo.metaDescription,
    path: "/coaches/modalidad/online",
    noindex: data.noindex,
    keywords: data.seo.keywords,
  });
}

export default async function OnlineCoachingPage() {
  const data = await getOnlineLandingData();
  const baseUrl = getSiteBaseUrl();

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: "Coaching online", path: "/coaches/modalidad/online" },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.seo.title,
    description: data.seo.metaDescription,
    url: `${baseUrl}/coaches/modalidad/online`,
    keywords: data.seo.keywords.join(", "),
  };

  const faqSchema =
    data.seo.faq.length >= 2
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: data.seo.faq.map((item) => ({
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
        hero={data.seo.hero}
        contextTitle="Atajos utiles"
        contextDescription="Accede rapido a rutas relacionadas para ampliar o acotar tu busqueda."
        contextLinks={data.contextLinks}
        trustStats={data.trustStats}
      >
        <LandingSection
          title={`${data.items.length} ${data.items.length === 1 ? "coach online" : "coaches online"} disponibles`}
          description="Compara perfiles que trabajan en remoto y elige por especialidad, encaje y rango de precio."
        >
          {data.items.length ? (
            <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data.items.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-black/10 bg-zinc-50 p-5">
              <p className="text-sm text-zinc-700">Ahora mismo no hay perfiles online activos.</p>
              <div className="mt-3">
                <Link
                  href="/coaches"
                  className="inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Ver el directorio completo
                </Link>
              </div>
            </div>
          )}
        </LandingSection>

        {data.exploreCards.length ? (
          <LandingSection
            title="Especialidades con mayor oferta online"
            description="Empieza por la especialidad para reducir ruido y comparar mejor."
          >
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
              {data.exploreCards.map((card) => (
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

        <FaqCompact title="Preguntas frecuentes sobre coaching online" items={data.seo.faq} />
      </LandingShell>
    </>
  );
}
