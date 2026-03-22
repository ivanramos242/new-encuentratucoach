import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { filterAndSortCoaches, getCategoryBySlug, getCityBySlug } from "@/lib/directory";
import {
  buildCategoryCityCopy,
  getListingContentWordCount,
} from "@/lib/listing-seo";
import { faqItems } from "@/lib/mock-data";
import { buildBreadcrumbList, buildItemListSchema, buildMetadata, shouldIndexListing } from "@/lib/seo";

type ParamsInput = Promise<{ categoriaSlug: string; ciudadSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { categoriaSlug, ciudadSlug } = await params;
  const category = getCategoryBySlug(categoriaSlug);
  const city = getCityBySlug(ciudadSlug);
  if (!category || !city) {
    return buildMetadata({
      title: "Landing no encontrada",
      description: "Landing no encontrada",
      path: `/coaches/categoria/${categoriaSlug}/${ciudadSlug}`,
      noindex: true,
    });
  }

  const items = filterAndSortCoaches({ cat: category.slug, location: city.slug, sort: "recent", page: 1 });
  if (items.length === 0) {
    return buildMetadata({
      title: `${category.name} en ${city.name}`,
      description: `No hay perfiles activos para ${category.name.toLowerCase()} en ${city.name}.`,
      path: `/coaches/categoria/${category.slug}/${city.slug}`,
      noindex: true,
    });
  }

  const copyBlocks = buildCategoryCityCopy(category.name, city.name);
  const contentWordCount = getListingContentWordCount({
    intro: copyBlocks,
    coaches: items,
    faqs: faqItems.slice(0, 3),
    extras: [
      `${category.name} en ${city.name}`,
      `Encuentra ${category.name.toLowerCase()} en ${city.name}. Compara perfiles por precio, modalidad y senales de confianza.`,
      "Como decidir mejor",
    ],
  });
  const shouldIndex = shouldIndexListing(items.length, contentWordCount);

  return buildMetadata({
    title: `${category.name} en ${city.name}: coaches para empezar proceso | EncuentraTuCoach`,
    description: `Encuentra ${category.name.toLowerCase()} en ${city.name}. Compara perfiles por precio, modalidad y senales de confianza.`,
    path: `/coaches/categoria/${category.slug}/${city.slug}`,
    noindex: !shouldIndex,
  });
}

export default async function CategoryCityLandingPage({ params }: { params: ParamsInput }) {
  const { categoriaSlug, ciudadSlug } = await params;
  const category = getCategoryBySlug(categoriaSlug);
  const city = getCityBySlug(ciudadSlug);
  if (!category || !city) notFound();

  const items = filterAndSortCoaches({ cat: category.slug, location: city.slug, sort: "recent", page: 1 });
  if (items.length === 0) notFound();

  const copyBlocks = buildCategoryCityCopy(category.name, city.name);
  const jsonLd = [
    buildBreadcrumbList([
      { name: "Inicio", path: "/" },
      { name: "Coaches", path: "/coaches" },
      { name: category.name, path: `/coaches/categoria/${category.slug}` },
      { name: city.name, path: `/coaches/categoria/${category.slug}/${city.slug}` },
    ]),
    buildItemListSchema({
      name: `${category.name} en ${city.name}`,
      path: `/coaches/categoria/${category.slug}/${city.slug}`,
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
        badge="Landing categoria + ciudad"
        title={`${category.name} en ${city.name}`}
        description={`Compara perfiles de ${category.name.toLowerCase()} en ${city.name} por precio, modalidad y certificacion.`}
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
            <li>
              <Link href={`/coaches/categoria/${category.slug}`} className="hover:text-cyan-700">
                {category.name}
              </Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-zinc-900">{city.name}</li>
          </ol>
        </nav>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Una landing de alta intencion</h2>
          <div className="mt-3 grid gap-3 text-sm leading-7 text-zinc-700">
            {copyBlocks.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
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
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Como decidir mejor</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                Prioriza encaje de especialidad y formato de sesion.
              </li>
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                Compara rango de precio antes de abrir conversaciones.
              </li>
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                Visita 2 o 3 perfiles y usa el formulario para validar feeling y disponibilidad.
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
