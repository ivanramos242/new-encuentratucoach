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
import { getSiteBaseUrl } from "@/lib/site-config";

type ParamsInput = Promise<{ categoriaSlug: string }>;

type CategorySeoContent = {
  title: string;
  heroTitle: string;
  heroDescription: string;
  metaDescription: string;
  keywords: string[];
  intentQueries: string[];
  faq: Array<{ q: string; a: string }>;
};

function buildDefaultCategorySeo(category: { name: string; slug: string; shortDescription: string }): CategorySeoContent {
  const lower = category.name.toLowerCase();
  return {
    title: `${category.name} en España`,
    heroTitle: `${category.name} en España`,
    heroDescription: `${category.shortDescription} Compara coaches por ciudad, modalidad y precio para encontrar mejor encaje.`,
    metaDescription: `Encuentra ${lower} en España por ciudad, modalidad, certificación y presupuesto.`,
    keywords: [`${lower}`, `coach ${lower}`, `${lower} españa`],
    intentQueries: [`${lower}`, `coach ${lower}`, `${lower} online`],
    faq: [
      {
        q: `¿Qué hace un coach de ${lower}?`,
        a: "Trabaja objetivos concretos con sesiones estructuradas, seguimiento y plan de acción medible.",
      },
      {
        q: `¿Cómo elegir ${lower}?`,
        a: "Compara 2 o 3 perfiles por metodología, modalidad y precio antes de contactar.",
      },
    ],
  };
}

function getCategorySeoContent(category: { name: string; slug: string; shortDescription: string }): CategorySeoContent {
  if (category.slug === "personal") {
    return {
      title: "Coaching personal en España",
      heroTitle: "Coaching personal en España",
      heroDescription:
        "Encuentra coaches de desarrollo personal por ciudad, modalidad y precio. Ideal para hábitos, autoestima, foco y objetivos de vida.",
      metaDescription:
        "Encuentra coaching personal en España. Compara coach personal en Madrid y Barcelona, modalidad online/presencial y rango de precio.",
      keywords: ["coaching personal", "coach personal madrid", "coach personal barcelona", "coaching personal online"],
      intentQueries: ["coach personal madrid", "coach personal barcelona", "coaching personal online", "buscar coaching personal"],
      faq: [
        {
          q: "¿Cuándo elegir coaching personal?",
          a: "Cuando necesitas claridad, enfoque y seguimiento para objetivos de hábitos, autoestima o decisiones vitales.",
        },
        {
          q: "¿Es mejor coach personal en Madrid/Barcelona u online?",
          a: "Depende de tu preferencia. Online da más oferta; presencial aporta cercanía local.",
        },
      ],
    };
  }

  if (category.slug === "carrera") {
    return {
      title: "Coaching de carrera en España",
      heroTitle: "Coaching de carrera para transición profesional",
      heroDescription:
        "Compara coaches de carrera para cambio laboral, entrevistas y posicionamiento profesional en Madrid, Barcelona y online.",
      metaDescription:
        "Encuentra coaching de carrera en España. Compara coach de carrera en Madrid y Barcelona por experiencia, formato y precio.",
      keywords: ["coaching de carrera", "coach de carrera madrid", "coach de carrera barcelona", "coach profesional madrid"],
      intentQueries: ["coach de carrera madrid", "coach de carrera barcelona", "coach profesional madrid", "coaching de carrera online"],
      faq: [
        {
          q: "¿Para qué sirve el coaching de carrera?",
          a: "Para definir siguiente paso profesional, preparar entrevistas y tomar decisiones laborales con criterio.",
        },
        {
          q: "¿Cómo elegir coach de carrera en Madrid o Barcelona?",
          a: "Evalúa experiencia en transición laboral, metodología y ajuste de presupuesto.",
        },
      ],
    };
  }

  if (category.slug === "liderazgo") {
    return {
      title: "Coaching de liderazgo en España",
      heroTitle: "Coaching de liderazgo y management",
      heroDescription:
        "Encuentra coaches de liderazgo para comunicación, gestión de equipos y toma de decisiones. Incluye opciones de coach directivo en Madrid y Barcelona.",
      metaDescription:
        "Encuentra coaching de liderazgo en España. Compara coach directivo en Madrid y Barcelona por modalidad, experiencia y precio.",
      keywords: ["coaching liderazgo", "coach liderazgo madrid", "coach liderazgo barcelona", "coach directivo madrid"],
      intentQueries: ["coach liderazgo madrid", "coach liderazgo barcelona", "coach directivo madrid", "coaching liderazgo online"],
      faq: [
        {
          q: "¿Qué mejora un proceso de coaching de liderazgo?",
          a: "Suele mejorar comunicación, delegación, gestión de conflictos y decisiones en contexto de equipo.",
        },
        {
          q: "¿Hay diferencia entre coach de liderazgo y coach directivo?",
          a: "Se solapan. El directivo suele enfocarse en roles de alta responsabilidad y objetivos de negocio.",
        },
      ],
    };
  }

  if (category.slug === "ejecutivo") {
    return {
      title: "Coaching ejecutivo en España",
      heroTitle: "Coaching ejecutivo para decisión y liderazgo",
      heroDescription:
        "Encuentra coaches ejecutivos para liderazgo, comunicación y rendimiento en Madrid, Barcelona y formato online.",
      metaDescription:
        "Encuentra coaching ejecutivo en España. Compara coach ejecutivo en Madrid y Barcelona por experiencia, modalidad y precio.",
      keywords: ["coaching ejecutivo", "coach ejecutivo madrid", "coach ejecutivo barcelona", "coach directivo madrid"],
      intentQueries: ["coach ejecutivo madrid", "coach ejecutivo barcelona", "coach directivo madrid", "coaching ejecutivo online"],
      faq: [
        {
          q: "¿Cuándo conviene contratar coaching ejecutivo?",
          a: "Cuando necesitas mejorar decisión, comunicación y gestión de equipo en contexto de alta responsabilidad.",
        },
        {
          q: "¿Qué revisar al elegir coach ejecutivo en Madrid o Barcelona?",
          a: "Evalúa experiencia con liderazgo real, metodología y seguimiento.",
        },
      ],
    };
  }

  return buildDefaultCategorySeo(category);
}

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
    }));

  const clusterCitySlugs = ["madrid", "barcelona", "valencia", "sevilla", "bilbao", "malaga"];
  const clusterCities = clusterCitySlugs
    .map((slug) => {
      const city = getCityBySlug(slug);
      if (!city) return null;
      return {
        slug,
        cityName: city.name,
        count: cityCounts.get(slug) ?? 0,
      };
    })
    .filter((item): item is { slug: string; cityName: string; count: number } => Boolean(item));

  const madrid = cityCounts.get("madrid") ?? 0;
  const barcelona = cityCounts.get("barcelona") ?? 0;
  const keyCities = [
    { slug: "madrid", cityName: "Madrid", count: madrid },
    { slug: "barcelona", cityName: "Barcelona", count: barcelona },
  ];

  const categoryCounts = new Map<string, number>();
  for (const coach of coaches) {
    for (const catSlug of coach.categories) {
      categoryCounts.set(catSlug, (categoryCounts.get(catSlug) ?? 0) + 1);
    }
  }

  const popularCategorySlugs = ["personal", "carrera", "liderazgo", "ejecutivo", "pareja", "bioemocional"];
  const relatedCategories = popularCategorySlugs
    .filter((slug) => slug !== category.slug)
    .map((slug) => {
      const item = getCategoryBySlug(slug);
      if (!item) return null;
      return {
        slug,
        name: item.name,
        count: categoryCounts.get(slug) ?? 0,
      };
    })
    .filter((item): item is { slug: string; name: string; count: number } => Boolean(item));

  const categorySeo = getCategorySeoContent(category);

  return {
    category,
    categorySeo,
    items,
    noindex,
    topCities,
    clusterCities,
    keyCities,
    relatedCategories,
  };
}

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug } = await params;
  const data = await getCategoryLandingData(categoriaSlug);
  if (!data) {
    return buildMetadata({ title: "Categoria no encontrada", description: "Categoria no encontrada", noindex: true });
  }

  return buildMetadata({
    title: data.categorySeo.title,
    description: data.categorySeo.metaDescription,
    path: `/coaches/categoria/${data.category.slug}`,
    noindex: data.noindex,
    keywords: data.categorySeo.keywords,
  });
}

export default async function CategoryLandingPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug } = await params;
  const data = await getCategoryLandingData(categoriaSlug);
  if (!data) notFound();

  const { category, categorySeo, items, topCities, clusterCities, keyCities, relatedCategories } = data;
  const baseUrl = getSiteBaseUrl();

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: category.name, path: `/coaches/categoria/${category.slug}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: categorySeo.title,
    description: categorySeo.metaDescription,
    url: `${baseUrl}/coaches/categoria/${category.slug}`,
    keywords: categorySeo.keywords.join(", "),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categorySeo.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <JsonLd data={[breadcrumb, collectionSchema, faqSchema]} />
      <PageHero badge="Especialidad" title={categorySeo.heroTitle} description={categorySeo.heroDescription} />
      <PageShell className="space-y-8 pt-8" containerClassName="max-w-[1700px]">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Cómo elegir {category.name.toLowerCase()}</h2>
          <p className="mt-2 text-zinc-700">
            Compara perfiles por ciudad, modalidad y precio y elige el coach que mejor encaje con tu objetivo.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {categorySeo.intentQueries.map((query) => (
              <span key={query} className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-sm font-semibold text-zinc-700">
                {query}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Madrid y Barcelona para {category.name.toLowerCase()}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {keyCities.map((item) => (
              <article key={item.slug} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <p className="text-lg font-black tracking-tight text-zinc-900">{category.name} en {item.cityName}</p>
                <p className="mt-1 text-sm text-zinc-700">{item.count} perfiles en esta combinación.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/coaches/categoria/${category.slug}/${item.slug}`}
                    className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    Ver combinación
                  </Link>
                  <Link
                    href={`/coaches/ciudad/${item.slug}`}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Ver ciudad
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Más ciudades para {category.name.toLowerCase()}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clusterCities.map((item) => (
              <article key={item.slug} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <p className="font-semibold text-zinc-900">{category.name} en {item.cityName}</p>
                <p className="mt-1 text-xs text-zinc-600">{item.count} perfiles en esta combinación</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/coaches/categoria/${category.slug}/${item.slug}`}
                    className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    Ver {item.cityName}
                  </Link>
                  <Link
                    href={`/coaches/ciudad/${item.slug}`}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Ciudad
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {topCities.length ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Ciudades top para {category.name.toLowerCase()}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/coaches/categoria/${category.slug}/${city.slug}`}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white"
                >
                  <p className="font-semibold text-zinc-900">{city.cityName}</p>
                  <p className="mt-1 text-xs text-zinc-600">{city.count} perfiles en esta combinación</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Otras especialidades populares</h2>
          <p className="mt-2 text-zinc-700">
            Explora especialidades relacionadas para comparar enfoques y tomar una mejor decisión.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCategories.map((item) => (
              <article key={item.slug} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <p className="font-semibold text-zinc-900">{item.name}</p>
                <p className="mt-1 text-xs text-zinc-600">{item.count} perfiles publicados</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/coaches/categoria/${item.slug}`}
                    className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    Ver categoría
                  </Link>
                  <Link
                    href={`/coaches/categoria/${item.slug}/madrid`}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Madrid
                  </Link>
                  <Link
                    href={`/coaches/categoria/${item.slug}/barcelona`}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Barcelona
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="sr-only">Listado de coaches de {category.name}</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.length ? items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Preguntas frecuentes</h2>
          <div className="mt-4 grid gap-3">
            {categorySeo.faq.map((item) => (
              <details key={item.q} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <summary className="cursor-pointer font-semibold text-zinc-900">{item.q}</summary>
                <p className="mt-2 text-sm text-zinc-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  );
}
