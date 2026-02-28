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

type ParamsInput = Promise<{ categoriaSlug: string; ciudadSlug: string }>;

type CategoryCitySeoContent = {
  title: string;
  heroTitle: string;
  heroDescription: string;
  metaDescription: string;
  keywords: string[];
  intentQueries: string[];
  faq: Array<{ q: string; a: string }>;
};

function defaultCategoryCitySeo(categoryName: string, cityName: string): CategoryCitySeoContent {
  const cat = categoryName.toLowerCase();
  const city = cityName.toLowerCase();
  return {
    title: `${categoryName} en ${cityName}`,
    heroTitle: `${categoryName} en ${cityName}`,
    heroDescription: `Compara perfiles por precio, modalidad y certificación para ${cat} en ${cityName}.`,
    metaDescription: `Encuentra ${cat} en ${cityName}. Compara coaches por modalidad, experiencia y presupuesto.`,
    keywords: [`${cat} ${city}`, `coach ${cat} ${city}`, `${cat} en ${city}`],
    intentQueries: [`${cat} ${city}`, `coach ${cat} ${city}`, `${cat} online ${city}`],
    faq: [
      {
        q: `¿Cómo elegir ${cat} en ${cityName}?`,
        a: "Compara especialización, método, modalidad y precio antes de contactar 2 o 3 perfiles.",
      },
      {
        q: "¿Conviene online o presencial para este objetivo?",
        a: "Depende de tu agenda y preferencia. Online amplía oferta; presencial aporta cercanía local.",
      },
    ],
  };
}

function getCategoryCitySeoContent(categorySlug: string, citySlug: string, categoryName: string, cityName: string): CategoryCitySeoContent {
  if (categorySlug === "personal" && citySlug === "madrid") {
    return {
      title: "Coach personal en Madrid",
      heroTitle: "Coach personal en Madrid",
      heroDescription:
        "Compara coaches personales en Madrid para hábitos, autoestima y claridad de objetivos con modalidad online o presencial.",
      metaDescription:
        "Encuentra coach personal en Madrid. Compara perfiles por enfoque, modalidad y precio para elegir con más confianza.",
      keywords: ["coach personal madrid", "coaching personal madrid", "mejor coach personal madrid"],
      intentQueries: ["coach personal madrid", "coaching personal madrid", "coach personal madrid precio"],
      faq: [
        {
          q: "¿Qué trabaja un coach personal en Madrid?",
          a: "Suele trabajar foco, hábitos, autoestima y planificación de objetivos con seguimiento.",
        },
        {
          q: "¿Cómo elegir mejor coach personal madrid?",
          a: "Compara metodología, experiencia en casos similares y modalidad que mejor encaje contigo.",
        },
      ],
    };
  }

  if (categorySlug === "personal" && citySlug === "barcelona") {
    return {
      title: "Coach personal en Barcelona",
      heroTitle: "Busco coach personal en Barcelona",
      heroDescription: "Encuentra coaches personales en Barcelona y filtra por modalidad, especialización y presupuesto.",
      metaDescription: "Encuentra coach personal en Barcelona. Compara perfiles por objetivo, modalidad y rango de precio.",
      keywords: ["coach personal barcelona", "coaching personal barcelona", "busco coach personal barcelona"],
      intentQueries: ["coach personal barcelona", "busco coach personal barcelona", "coaching personal barcelona"],
      faq: [
        {
          q: "¿Busco coach personal barcelona: por dónde empiezo?",
          a: "Empieza por objetivo, revisa modalidades disponibles y contacta con un mensaje claro de situación y meta.",
        },
        {
          q: "¿Hay coaching personal online para Barcelona?",
          a: "Sí, puedes combinar ubicación y formato online para ampliar opciones.",
        },
      ],
    };
  }

  if (categorySlug === "carrera" && citySlug === "madrid") {
    return {
      title: "Coach de carrera en Madrid",
      heroTitle: "Coach de carrera en Madrid",
      heroDescription:
        "Compara coaches de carrera en Madrid para transición laboral, entrevistas y posicionamiento profesional.",
      metaDescription:
        "Encuentra coach de carrera en Madrid. Compara experiencia, modalidad y precio para tomar decisiones profesionales.",
      keywords: ["coach de carrera madrid", "coaching de carrera madrid", "coach profesional madrid"],
      intentQueries: ["coach de carrera madrid", "coach profesional madrid", "coaching de carrera madrid"],
      faq: [
        {
          q: "¿Qué resultados busca el coaching de carrera en Madrid?",
          a: "Claridad de siguiente paso, mejor narrativa profesional y preparación de procesos de selección.",
        },
        {
          q: "¿Cómo comparar coach profesional madrid para carrera?",
          a: "Revisa experiencia en transición laboral y metodología de trabajo.",
        },
      ],
    };
  }

  if (categorySlug === "carrera" && citySlug === "barcelona") {
    return {
      title: "Coach de carrera en Barcelona",
      heroTitle: "Coach de carrera en Barcelona",
      heroDescription:
        "Encuentra coaches de carrera en Barcelona para cambio laboral, entrevistas y crecimiento profesional.",
      metaDescription: "Encuentra coach de carrera en Barcelona y compara perfiles por modalidad, enfoque y precio.",
      keywords: ["coach de carrera barcelona", "coaching de carrera barcelona", "busco coach barcelona carrera"],
      intentQueries: ["coach de carrera barcelona", "coaching de carrera barcelona", "coach online barcelona carrera"],
      faq: [
        {
          q: "¿Cómo elegir coaching de carrera en Barcelona?",
          a: "Prioriza coaches con experiencia en tu sector y plan de acción concreto para las próximas semanas.",
        },
        {
          q: "¿Conviene online o presencial para carrera?",
          a: "Ambos formatos funcionan; elige según agenda y preferencia de trabajo.",
        },
      ],
    };
  }

  if (categorySlug === "liderazgo" && citySlug === "madrid") {
    return {
      title: "Coach de liderazgo en Madrid",
      heroTitle: "Coach de liderazgo en Madrid",
      heroDescription:
        "Encuentra coach de liderazgo y coach directivo en Madrid para comunicación, equipos y toma de decisiones.",
      metaDescription:
        "Encuentra coach de liderazgo en Madrid y compara coach directivo madrid por experiencia, modalidad y precio.",
      keywords: ["coach liderazgo madrid", "coach directivo madrid", "coaching liderazgo madrid"],
      intentQueries: ["coach liderazgo madrid", "coach directivo madrid", "coaching liderazgo madrid"],
      faq: [
        {
          q: "¿Qué diferencia hay entre coach liderazgo madrid y coach directivo madrid?",
          a: "Se solapan; directivo suele enfocarse en alta responsabilidad y objetivos de negocio.",
        },
        {
          q: "¿Cómo elegir coach de liderazgo en Madrid?",
          a: "Evalúa experiencia con managers, metodología y resultados esperables en tu contexto.",
        },
      ],
    };
  }

  if (categorySlug === "liderazgo" && citySlug === "barcelona") {
    return {
      title: "Coach de liderazgo en Barcelona",
      heroTitle: "Coach de liderazgo en Barcelona",
      heroDescription:
        "Compara coaches de liderazgo en Barcelona para management, comunicación y rendimiento de equipos.",
      metaDescription:
        "Encuentra coach de liderazgo en Barcelona. Compara perfiles por formato, experiencia y rango de precio.",
      keywords: ["coach liderazgo barcelona", "coaching liderazgo barcelona", "coach directivo barcelona"],
      intentQueries: ["coach liderazgo barcelona", "coaching liderazgo barcelona", "coach directivo barcelona"],
      faq: [
        {
          q: "¿Para qué casos se usa coaching de liderazgo en Barcelona?",
          a: "Para mejorar comunicación, delegación, gestión de conflictos y toma de decisiones en equipo.",
        },
        {
          q: "¿Es útil combinar liderazgo con coaching ejecutivo?",
          a: "Sí, especialmente en roles de dirección o crecimiento de responsabilidad.",
        },
      ],
    };
  }

  if (categorySlug === "ejecutivo" && citySlug === "madrid") {
    return {
      title: "Coach ejecutivo en Madrid",
      heroTitle: "Coach ejecutivo en Madrid",
      heroDescription:
        "Encuentra coaches ejecutivos en Madrid para liderazgo, decisión y gestión de equipos con modalidad online o presencial.",
      metaDescription:
        "Encuentra coach ejecutivo en Madrid y compara perfiles por experiencia, formato y precio para roles de alta responsabilidad.",
      keywords: ["coach ejecutivo madrid", "coaching ejecutivo madrid", "coach directivo madrid"],
      intentQueries: ["coach ejecutivo madrid", "coach directivo madrid", "coaching ejecutivo madrid"],
      faq: [
        {
          q: "¿Qué objetivo cubre un coach ejecutivo en Madrid?",
          a: "Suele enfocarse en liderazgo, decisión, comunicación y gestión de equipos con seguimiento.",
        },
        {
          q: "¿Cómo elegir coach ejecutivo madrid?",
          a: "Compara experiencia en dirección, metodología y resultados esperables en tu contexto.",
        },
      ],
    };
  }

  if (categorySlug === "ejecutivo" && citySlug === "barcelona") {
    return {
      title: "Coach ejecutivo en Barcelona",
      heroTitle: "Coach ejecutivo en Barcelona",
      heroDescription:
        "Compara coaches ejecutivos en Barcelona para liderazgo, management y toma de decisiones con foco en negocio.",
      metaDescription:
        "Encuentra coach ejecutivo en Barcelona. Compara modalidad, experiencia y precio para elegir mejor encaje.",
      keywords: ["coach ejecutivo barcelona", "coaching ejecutivo barcelona", "coach directivo barcelona"],
      intentQueries: ["coach ejecutivo barcelona", "coaching ejecutivo barcelona", "coach directivo barcelona"],
      faq: [
        {
          q: "¿Cuándo conviene coaching ejecutivo en Barcelona?",
          a: "Cuando necesitas evolucionar liderazgo, delegación y rendimiento de equipos en un rol de responsabilidad.",
        },
        {
          q: "¿Online o presencial para coaching ejecutivo?",
          a: "Ambos formatos funcionan; elige por agenda, preferencia y tipo de dinámica de trabajo.",
        },
      ],
    };
  }

  return defaultCategoryCitySeo(categoryName, cityName);
}

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
  const seo = getCategoryCitySeoContent(category.slug, city.slug, category.name, city.name);

  const clusterCitySlugs = ["madrid", "barcelona", "valencia", "sevilla", "bilbao", "malaga"];
  const cityCounts = new Map<string, number>();
  for (const coach of coaches) {
    if (!coach.categories.includes(category.slug)) continue;
    cityCounts.set(coach.citySlug, (cityCounts.get(coach.citySlug) ?? 0) + 1);
  }

  const categoryInPopularCities = clusterCitySlugs
    .map((slug) => {
      const item = getCityBySlug(slug);
      if (!item) return null;
      return {
        slug,
        cityName: item.name,
        count: cityCounts.get(slug) ?? 0,
      };
    })
    .filter((item): item is { slug: string; cityName: string; count: number } => Boolean(item));

  const popularCategorySlugs = ["personal", "carrera", "liderazgo", "ejecutivo", "pareja", "bioemocional"];
  const categoryCounts = new Map<string, number>();
  for (const coach of coaches) {
    if (coach.citySlug !== city.slug) continue;
    for (const catSlug of coach.categories) {
      categoryCounts.set(catSlug, (categoryCounts.get(catSlug) ?? 0) + 1);
    }
  }

  const relatedCategoriesInCity = popularCategorySlugs
    .filter((slug) => slug !== category.slug)
    .map((slug) => {
      const cat = getCategoryBySlug(slug);
      if (!cat) return null;
      return {
        slug,
        name: cat.name,
        count: categoryCounts.get(slug) ?? 0,
      };
    })
    .filter((item): item is { slug: string; name: string; count: number } => Boolean(item));

  return {
    category,
    city,
    seo,
    items,
    noindex,
    minToIndex,
    categoryInPopularCities,
    relatedCategoriesInCity,
  };
}

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug, ciudadSlug } = await params;
  const data = await getCategoryCityLandingData(categoriaSlug, ciudadSlug);
  if (!data) {
    return buildMetadata({ title: "Landing no encontrada", description: "Landing no encontrada", noindex: true });
  }

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

  const { category, city, seo, items, categoryInPopularCities, relatedCategoriesInCity } = data;
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

  const faqSchema = {
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
  };

  return (
    <>
      <JsonLd data={[breadcrumb, collectionSchema, faqSchema]} />
      <PageHero badge="Especialidad + ciudad" title={seo.heroTitle} description={seo.heroDescription} />
      <PageShell className="space-y-8 pt-8" containerClassName="max-w-[1700px]">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Cómo elegir {category.name.toLowerCase()} en {city.name}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {seo.intentQueries.map((query) => (
              <span key={query} className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-sm font-semibold text-zinc-700">
                {query}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">{category.name} en más ciudades</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryInPopularCities.map((item) => (
              <article key={item.slug} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <p className="font-semibold text-zinc-900">{category.name} en {item.cityName}</p>
                <p className="mt-1 text-xs text-zinc-600">{item.count} perfiles en esta combinación</p>
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
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Especialidades populares en {city.name}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCategoriesInCity.map((item) => (
              <article key={item.slug} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <p className="font-semibold text-zinc-900">{item.name} en {city.name}</p>
                <p className="mt-1 text-xs text-zinc-600">{item.count} perfiles en esta ciudad</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/coaches/categoria/${item.slug}/${city.slug}`}
                    className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    Ver {city.name}
                  </Link>
                  <Link
                    href={`/coaches/categoria/${item.slug}`}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Ver categoría
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="sr-only">
            Listado de {category.name.toLowerCase()} en {city.name}
          </h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.length ? items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Preguntas frecuentes</h2>
          <div className="mt-4 grid gap-3">
            {seo.faq.map((item) => (
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
