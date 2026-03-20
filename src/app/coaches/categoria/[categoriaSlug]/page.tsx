import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { filterAndSortCoaches, getCategoryBySlug } from "@/lib/directory";
import {
  buildCategoryCopy,
  getCategoryIntentLabel,
  getListingContentWordCount,
} from "@/lib/listing-seo";
import { cities, faqItems } from "@/lib/mock-data";
import { buildBreadcrumbList, buildItemListSchema, buildMetadata, shouldIndexListing } from "@/lib/seo";

type ParamsInput = Promise<{ categoriaSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug } = await params;
  const category = getCategoryBySlug(categoriaSlug);
  if (!category) {
    return buildMetadata({
      title: "Categoria no encontrada",
      description: "Categoria no encontrada",
      path: `/coaches/categoria/${categoriaSlug}`,
      noindex: true,
    });
  }

  const items = filterAndSortCoaches({ cat: category.slug, sort: "recent", page: 1 });
  if (items.length === 0) {
    return buildMetadata({
      title: category.name,
      description: `No hay perfiles activos para ${category.name.toLowerCase()}.`,
      path: `/coaches/categoria/${category.slug}`,
      noindex: true,
    });
  }

  const copyBlocks = buildCategoryCopy(category.name);
  const categoryLabel = getCategoryIntentLabel(category.name);
  const contentWordCount = getListingContentWordCount({
    intro: copyBlocks,
    coaches: items,
    faqs: faqItems.slice(0, 3),
    extras: [
      category.name,
      category.shortDescription,
      `Encuentra coach de ${categoryLabel} online y en Espana.`,
      "Que ofrece esta especialidad",
      "Cuando elegir esta categoria",
    ],
  });
  const shouldIndex = shouldIndexListing(items.length, contentWordCount);

  return buildMetadata({
    title: `${category.name}: encuentra coach de ${categoryLabel} online y en Espana | EncuentraTuCoach`,
    description: `Compara perfiles especializados en ${categoryLabel}. Modalidad, precio y confianza antes de contactar.`,
    path: `/coaches/categoria/${category.slug}`,
    noindex: !shouldIndex,
  });
}

export default async function CategoryLandingPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug } = await params;
  const category = getCategoryBySlug(categoriaSlug);
  if (!category) notFound();

  const items = filterAndSortCoaches({ cat: category.slug, sort: "recent", page: 1 });
  if (items.length === 0) notFound();

  const copyBlocks = buildCategoryCopy(category.name);
  const topCities = cities.filter((city) => items.some((coach) => coach.citySlug === city.slug)).slice(0, 4);
  const jsonLd = [
    buildBreadcrumbList([
      { name: "Inicio", path: "/" },
      { name: "Coaches", path: "/coaches" },
      { name: category.name, path: `/coaches/categoria/${category.slug}` },
    ]),
    buildItemListSchema({
      name: `${category.name} en Espana`,
      path: `/coaches/categoria/${category.slug}`,
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
        badge="Landing por especialidad"
        title={category.name}
        description={`${category.shortDescription} Compara coaches por ciudad, modalidad y precio.`}
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
            <li className="font-semibold text-zinc-900">{category.name}</li>
          </ol>
        </nav>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Que ofrece esta especialidad</h2>
          <div className="mt-3 grid gap-3 text-sm leading-7 text-zinc-700">
            {copyBlocks.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/coaches/categoria/${category.slug}/${city.slug}`}
                className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white"
              >
                {category.name} en {city.name}
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Cuando elegir esta categoria</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                Usala si tu objetivo principal encaja con esta especialidad y quieres comparar oferta real.
              </li>
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                Refina por ciudad cuando necesites intencion local o sesiones presenciales.
              </li>
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                Si aun estas explorando, vuelve al directorio general para abrir mas opciones.
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
