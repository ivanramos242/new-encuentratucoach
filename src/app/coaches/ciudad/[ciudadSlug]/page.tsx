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

type ParamsInput = Promise<{ ciudadSlug: string }>;

type CitySeoContent = {
  title: string;
  heroTitle: string;
  heroDescription: string;
  metaDescription: string;
  keywords: string[];
  intentQueries: string[];
  faq: Array<{ q: string; a: string }>;
};

const POPULAR_CATEGORY_SLUGS = [
  "personal",
  "carrera",
  "liderazgo",
  "ejecutivo",
  "pareja",
  "bioemocional",
] as const;

const CLUSTER_CITY_SLUGS = [
  "madrid",
  "barcelona",
  "valencia",
  "sevilla",
  "bilbao",
  "malaga",
] as const;

function defaultCitySeoContent(cityName: string): CitySeoContent {
  const city = cityName.toLowerCase();
  return {
    title: `Coaching en ${cityName}`,
    heroTitle: `Coach en ${cityName}`,
    heroDescription: `Compara coaches en ${cityName} por especialidad, modalidad, certificación y precio para encontrar mejor encaje desde el primer contacto.`,
    metaDescription: `Encuentra coach en ${cityName} por especialidad, modalidad, certificación y presupuesto.`,
    keywords: [`coach en ${city}`, `coaching ${city}`, `buscar coach ${city}`],
    intentQueries: [`coach en ${city}`, `coaching ${city}`, `buscar coach ${city}`],
    faq: [
      {
        q: `¿Cómo elegir coach en ${cityName}?`,
        a: "Define objetivo, modalidad y presupuesto. Compara 2 o 3 perfiles y contacta con un mensaje claro de contexto.",
      },
      {
        q: "¿Es mejor coaching online o presencial?",
        a: "Depende de tu preferencia y agenda. Online ofrece más opciones; presencial puede aportar más contexto local.",
      },
    ],
  };
}

function getCitySeoContent(citySlug: string, cityName: string): CitySeoContent {
  if (citySlug === "madrid") {
    return {
      title: "Coach en Madrid",
      heroTitle: "Coach en Madrid: encuentra tu coach profesional",
      heroDescription:
        "Si buscas coach madrid, aquí puedes comparar coach profesional madrid, coach directivo madrid y coach online por especialidad y precio.",
      metaDescription:
        "Encuentra coach en Madrid y compara coach profesional madrid, coach directivo madrid, servicios de coaching madrid y coach madrid precio.",
      keywords: [
        "coach madrid",
        "coach en madrid",
        "coach profesional madrid",
        "mejor coach madrid",
        "coach madrid precio",
        "servicios de coaching madrid",
        "coaching madrid",
        "coach directivo madrid",
      ],
      intentQueries: [
        "coach madrid",
        "coach profesional madrid",
        "coach directivo madrid",
        "coach madrid precio",
        "servicios de coaching madrid",
      ],
      faq: [
        {
          q: "¿Cómo encontrar coach profesional en Madrid sin perder tiempo?",
          a: "Empieza por especialidad y objetivo, revisa modalidad y precio, y contacta 2 o 3 perfiles con un mensaje concreto.",
        },
        {
          q: "¿Cuál es el rango de coach madrid precio?",
          a: "Depende de especialidad y experiencia. Aquí puedes comparar perfiles por presupuesto para ajustar mejor la decisión.",
        },
        {
          q: "¿Hay coach directivo madrid y coach de carrera en esta página?",
          a: "Sí. Usa los enlaces por categoría para ver combinaciones locales de mayor intención comercial.",
        },
      ],
    };
  }

  if (citySlug === "barcelona") {
    return {
      title: "Coach en Barcelona",
      heroTitle: "Busco coach Barcelona: opciones por especialidad y modalidad",
      heroDescription:
        "Si buscas coach en Barcelona, compara perfiles por objetivo, formato online o presencial, certificación y precio.",
      metaDescription:
        "Encuentra coach en Barcelona y compara perfiles por especialidad, modalidad y presupuesto para decidir más rápido.",
      keywords: [
        "busco coach barcelona",
        "coach barcelona",
        "coach en barcelona",
        "coaching barcelona",
        "buscar coach barcelona",
      ],
      intentQueries: [
        "busco coach barcelona",
        "coach en barcelona",
        "coaching barcelona",
        "coach online barcelona",
      ],
      faq: [
        {
          q: "¿Busco coach barcelona: por dónde empiezo?",
          a: "Define objetivo, elige modalidad y revisa perfiles con mejor encaje. Luego contacta con un mensaje claro de situación y meta.",
        },
        {
          q: "¿Puedo encontrar coach online si estoy en Barcelona?",
          a: "Sí. Puedes combinar ubicación Barcelona con modalidad online para ampliar oferta y comparar más perfiles.",
        },
        {
          q: "¿Qué diferencia hay entre coaching personal y de carrera en Barcelona?",
          a: "Depende del objetivo: personal para hábitos y claridad vital; carrera para transición profesional, entrevistas y decisiones laborales.",
        },
      ],
    };
  }

  return defaultCitySeoContent(cityName);
}

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

  const popularCategories = POPULAR_CATEGORY_SLUGS.map((slug) => {
    const count = categoryCounts.get(slug) ?? 0;
    const category = getCategoryBySlug(slug);
    return {
      slug,
      name: category?.name ?? slug,
      count,
      indexable: count >= minToIndex,
    };
  });

  const comboCounts = new Map<string, number>();
  for (const coach of coaches) {
    for (const categorySlug of coach.categories) {
      const key = `${categorySlug}|${coach.citySlug}`;
      comboCounts.set(key, (comboCounts.get(key) ?? 0) + 1);
    }
  }

  const clusterCities = CLUSTER_CITY_SLUGS.filter((slug) => slug !== city.slug).flatMap((slug) => {
    const cityItem = getCityBySlug(slug);
    if (!cityItem) return [];

    const categoryLinks = POPULAR_CATEGORY_SLUGS.map((categorySlug) => {
      const key = `${categorySlug}|${slug}`;
      const count = comboCounts.get(key) ?? 0;
      const category = getCategoryBySlug(categorySlug);
      return {
        categorySlug,
        categoryName: category?.name ?? categorySlug,
        count,
        indexable: count >= minToIndex,
      };
    })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return [
      {
        slug,
        cityName: cityItem.name,
        categoryLinks,
      },
    ];
  });

  const citySeo = getCitySeoContent(city.slug, city.name);

  return {
    city,
    citySeo,
    items,
    noindex,
    minToIndex,
    topCategories,
    popularCategories,
    clusterCities,
  };
}

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { ciudadSlug } = await params;
  const data = await getCityLandingData(ciudadSlug);
  if (!data) return buildMetadata({ title: "Ciudad no encontrada", description: "Ciudad no encontrada", noindex: true });

  return buildMetadata({
    title: data.citySeo.title,
    description: data.citySeo.metaDescription,
    path: `/coaches/ciudad/${data.city.slug}`,
    noindex: data.noindex,
    keywords: data.citySeo.keywords,
  });
}

export default async function CityLandingPage({ params }: { params: ParamsInput }) {
  const { ciudadSlug } = await params;
  const data = await getCityLandingData(ciudadSlug);
  if (!data) notFound();

  const { city, citySeo, items, noindex, minToIndex, topCategories, popularCategories, clusterCities } = data;
  const baseUrl = getSiteBaseUrl();

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: `Coaches en ${city.name}`, path: `/coaches/ciudad/${city.slug}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: citySeo.title,
    description: citySeo.metaDescription,
    url: `${baseUrl}/coaches/ciudad/${city.slug}`,
    keywords: citySeo.keywords.join(", "),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: citySeo.faq.map((item) => ({
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
      <PageHero
        badge="Landing SEO por ciudad"
        title={citySeo.heroTitle}
        description={citySeo.heroDescription}
      />
      <PageShell className="space-y-6 pt-8" containerClassName="max-w-[1700px]">
        {noindex ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Esta landing no se indexa todavía porque tiene menos de {minToIndex} coaches publicados.
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/coaches" className="font-semibold underline">
                Ir al directorio general
              </Link>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Búsquedas locales en {city.name}</h2>
          <p className="mt-2 text-zinc-700">
            Esta landing está orientada a intención transaccional local para ayudar a decidir más rápido según objetivo y presupuesto.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {citySeo.intentQueries.map((query) => (
              <span key={query} className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-sm font-semibold text-zinc-700">
                {query}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Clúster local sin canibalizar /coaches</h2>
          <p className="mt-2 text-zinc-700">
            Estas URLs de ciudad y categoría+ciudad son las indexables del clúster local. Los filtros por query en el directorio
            principal deben seguir como soporte UX, no como páginas objetivo de posicionamiento.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Categoría + {city.name}: rutas clave</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularCategories.map((category) => (
              <article key={category.slug} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <p className="font-semibold text-zinc-900">{category.name} en {city.name}</p>
                <p className="mt-1 text-xs text-zinc-600">{category.count} perfiles en esta combinación</p>
                {!category.indexable ? (
                  <p className="mt-1 text-xs font-semibold text-amber-700">Combinación noindex por cobertura baja</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/coaches/categoria/${category.slug}/${city.slug}`}
                    className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    Ver combinación
                  </Link>
                  <Link
                    href={`/coaches/categoria/${category.slug}`}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Ver categoría
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {topCategories.length ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Más buscado ahora en {city.name}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/coaches/categoria/${category.slug}/${city.slug}`}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-4 hover:bg-white"
                >
                  <p className="font-semibold text-zinc-900">{category.name}</p>
                  <p className="mt-1 text-xs text-zinc-600">{category.count} perfiles en esta combinación</p>
                  {!category.indexable ? (
                    <p className="mt-1 text-xs font-semibold text-amber-700">Combinación noindex por cobertura baja</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">
            Misma intención en otras ciudades populares
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clusterCities.map((clusterCity) => (
              <article key={clusterCity.slug} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <p className="font-semibold text-zinc-900">Coaches en {clusterCity.cityName}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {clusterCity.categoryLinks.map((item) => (
                    <Link
                      key={`${clusterCity.slug}-${item.categorySlug}`}
                      href={`/coaches/categoria/${item.categorySlug}/${clusterCity.slug}`}
                      className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                    >
                      {item.categoryName} ({item.count})
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="sr-only">Listado de coaches en {city.name}</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.length ? items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Preguntas frecuentes en {city.name}</h2>
          <div className="mt-4 grid gap-3">
            {citySeo.faq.map((item) => (
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
