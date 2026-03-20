import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { filterAndSortCoaches, getCityBySlug } from "@/lib/directory";
import { buildCityCopy, getListingContentWordCount } from "@/lib/listing-seo";
import { faqItems } from "@/lib/mock-data";
import { buildBreadcrumbList, buildItemListSchema, buildMetadata, shouldIndexListing } from "@/lib/seo";

type ParamsInput = Promise<{ ciudadSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { ciudadSlug } = await params;
  const city = getCityBySlug(ciudadSlug);
  if (!city) {
    return buildMetadata({
      title: "Ciudad no encontrada",
      description: "Ciudad no encontrada",
      path: `/coaches/ciudad/${ciudadSlug}`,
      noindex: true,
    });
  }

  const items = filterAndSortCoaches({ location: city.slug, sort: "recent", page: 1 });
  if (items.length === 0) {
    return buildMetadata({
      title: `Coach en ${city.name}`,
      description: `No hay resultados activos para ${city.name}.`,
      path: `/coaches/ciudad/${city.slug}`,
      noindex: true,
    });
  }

  const copyBlocks = buildCityCopy(city.name);
  const contentWordCount = getListingContentWordCount({
    intro: copyBlocks,
    coaches: items,
    faqs: faqItems.slice(0, 3),
    extras: [
      `Coach en ${city.name}`,
      `Compara coaches online y presenciales en ${city.name}. Filtra por presupuesto, modalidad y senales de confianza.`,
      `Como buscar coach en ${city.name}`,
      `Que mirar antes de contactar`,
    ],
  });
  const shouldIndex = shouldIndexListing(items.length, contentWordCount);

  return buildMetadata({
    title: `Coach en ${city.name}: compara coaches online y presenciales | EncuentraTuCoach`,
    description: `Filtra por enfoque y presupuesto. Contacta 2-3 coaches en ${city.name} con mejor encaje.`,
    path: `/coaches/ciudad/${city.slug}`,
    noindex: !shouldIndex,
  });
}

export default async function CityLandingPage({ params }: { params: ParamsInput }) {
  const { ciudadSlug } = await params;
  const city = getCityBySlug(ciudadSlug);
  if (!city) notFound();

  const items = filterAndSortCoaches({ location: city.slug, sort: "recent", page: 1 });
  if (items.length === 0) notFound();

  const copyBlocks = buildCityCopy(city.name);
  const jsonLd = [
    buildBreadcrumbList([
      { name: "Inicio", path: "/" },
      { name: "Coaches", path: "/coaches" },
      { name: city.name, path: `/coaches/ciudad/${city.slug}` },
    ]),
    buildItemListSchema({
      name: `Coaches en ${city.name}`,
      path: `/coaches/ciudad/${city.slug}`,
      items: items.map((coach) => ({
        name: coach.name,
        path: `/coaches/${coach.slug}`,
      })),
    }),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero
        badge="Landing por ciudad"
        title={`Coach en ${city.name}`}
        description={`Compara coaches online y presenciales en ${city.name}. Filtra por presupuesto, modalidad y senales de confianza.`}
      />
      <PageShell className="pt-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-cyan-700">
                Inicio
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/coaches" className="hover:text-cyan-700">
                Coaches
              </Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-zinc-900">{city.name}</li>
          </ol>
        </nav>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Como buscar coach en {city.name}</h2>
          <div className="mt-3 grid gap-3 text-sm leading-7 text-zinc-700">
            {copyBlocks.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/coaches/categoria/personal/${city.slug}`}
              className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white"
            >
              Coaching personal en {city.name}
            </Link>
            <Link
              href={`/coaches/categoria/liderazgo/${city.slug}`}
              className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white"
            >
              Liderazgo en {city.name}
            </Link>
            <Link
              href="/coaching-personal"
              className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white"
            >
              Guia de coaching personal
            </Link>
          </div>
        </section>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Que mirar antes de contactar</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                Compara 2 o 3 perfiles por enfoque, precio y modalidad.
              </li>
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                Prioriza senales de confianza y disponibilidad real.
              </li>
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                Si buscas un objetivo concreto, pasa a una landing por categoria y ciudad.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Preguntas frecuentes</h2>
            <div className="mt-4 space-y-4">
              {faqItems.slice(0, 3).map((faq) => (
                <article key={faq.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                  <h3 className="text-sm font-black tracking-tight text-zinc-950">{faq.question}</h3>
                  <div
                    className="mt-2 text-sm leading-6 text-zinc-700"
                    dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}
