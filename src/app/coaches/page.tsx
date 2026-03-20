import Link from "next/link";
import type { Metadata } from "next";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import {
  PAGE_SIZE,
  filterAndSortCoaches,
  paginateCoaches,
  parseDirectoryFilters,
} from "@/lib/directory";
import { coachCategories, cities, faqItems } from "@/lib/mock-data";
import {
  buildBreadcrumbList,
  buildDirectoryCanonicalPath,
  buildItemListSchema,
  buildMetadata,
  directoryHasSearchState,
} from "@/lib/seo";
import { formatEuro } from "@/lib/utils";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

function buildPaginationHref(page: number, raw: Record<string, string | string[] | undefined>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (key === "page") continue;
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => sp.append(key, item));
    } else if (value !== "") {
      sp.set(key, value);
    }
  }
  if (page > 1) sp.set("page", String(page));
  const query = sp.toString();
  return query ? `/coaches?${query}` : "/coaches";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}): Promise<Metadata> {
  const raw = await searchParams;
  const filters = parseDirectoryFilters(raw);
  const canonicalPath = buildDirectoryCanonicalPath(
    filters,
    new Set(coachCategories.map((item) => item.slug)),
    new Set(cities.map((item) => item.slug)),
  );
  const hasSearchState = directoryHasSearchState(filters);

  return buildMetadata({
    title: "Buscar coach en Espana | Directorio por especialidad, ciudad y modalidad",
    description:
      "Filtra por especialidad, ciudad, modalidad online o presencial y presupuesto. Compara perfiles reales y contacta.",
    path: "/coaches",
    canonicalPath,
    noindex: hasSearchState,
  });
}

export default async function CoachesDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const raw = await searchParams;
  const filters = parseDirectoryFilters(raw);
  const allResults = filterAndSortCoaches(filters);
  const paginated = paginateCoaches(allResults, filters.page ?? 1, PAGE_SIZE);
  const hasSearchState = directoryHasSearchState(filters);

  const jsonLd = [
    buildBreadcrumbList([
      { name: "Inicio", path: "/" },
      { name: "Coaches", path: "/coaches" },
    ]),
    buildItemListSchema({
      name: "Directorio de coaches en España",
      path: "/coaches",
      items: paginated.items.map((coach) => ({
        name: coach.name,
        path: `/coaches/${coach.slug}`,
      })),
    }),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero
        badge="Directorio principal"
        title="Buscar coach en España"
        description="Filtra por especialidad, ciudad, modalidad y presupuesto. Compara perfiles reales y contacta."
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
            <li className="font-semibold text-zinc-900">Coaches</li>
          </ol>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="h-fit rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black tracking-tight text-zinc-950">Filtros</h2>
            <form action="/coaches" className="mt-4 grid gap-4">
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Buscar
                <input
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Ciudad, especialidad, nombre..."
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>

              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Categoría
                <select
                  name="cat"
                  defaultValue={filters.cat ?? ""}
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                >
                  <option value="">Todas</option>
                  {coachCategories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Ciudad
                <select
                  name="location"
                  defaultValue={filters.location ?? ""}
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                >
                  <option value="">Toda España</option>
                  {cities.map((city) => (
                    <option key={city.slug} value={city.slug}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-zinc-800">Modalidad</legend>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" name="session" value="online" defaultChecked={filters.session?.includes("online")} />
                  Online
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    name="session"
                    value="presencial"
                    defaultChecked={filters.session?.includes("presencial")}
                  />
                  Presencial
                </label>
              </fieldset>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" name="certified" value="certified" defaultChecked={filters.certified} />
                Solo coaches verificados
              </label>

              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Idioma
                <input
                  name="idioma"
                  defaultValue={filters.idioma}
                  placeholder="Ej: inglés"
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm font-medium text-zinc-800">
                  Precio min
                  <input
                    type="number"
                    name="price_min"
                    min={0}
                    defaultValue={filters.priceMin ?? 0}
                    className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-zinc-800">
                  Precio max
                  <input
                    type="number"
                    name="price_max"
                    min={0}
                    defaultValue={filters.priceMax ?? 500}
                    className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Ordenar
                <select
                  name="sort"
                  defaultValue={filters.sort ?? "recent"}
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                >
                  <option value="recent">Más recientes</option>
                  <option value="price_asc">Precio ascendente</option>
                  <option value="price_desc">Precio descendente</option>
                  <option value="rating_desc">Mejor valoración</option>
                </select>
              </label>

              <div className="flex gap-2">
                <button className="flex-1 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
                  Aplicar filtros
                </button>
                <Link
                  href="/coaches"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  Limpiar
                </Link>
              </div>
            </form>
          </aside>

          <section>
            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-zinc-950">
                    {allResults.length} {allResults.length === 1 ? "resultado" : "resultados"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {hasSearchState
                      ? "Las combinaciones con parámetros se marcan como noindex y apuntan a su landing canónica."
                      : "Página canónica principal del directorio."}
                  </p>
                </div>
                <div className="text-right text-sm text-zinc-600">
                  <p>
                    Página {paginated.currentPage} de {paginated.totalPages}
                  </p>
                  <p>{PAGE_SIZE} por página</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-black/5 pt-4 sm:grid-cols-2 xl:grid-cols-3">
                <QuickLinkCard
                  href="/coaches/ciudad/madrid"
                  title="Coach en Madrid"
                  text="La landing con más intención local."
                />
                <QuickLinkCard
                  href="/coaches/ciudad/barcelona"
                  title="Coach en Barcelona"
                  text="Compara perfiles online y presenciales."
                />
                <QuickLinkCard
                  href="/coaches/categoria/personal"
                  title="Coaching personal"
                  text="Especialidad clave para captar demanda genérica."
                />
              </div>

              {(filters.q ||
                filters.cat ||
                filters.location ||
                filters.certified ||
                filters.idioma ||
                filters.session?.length ||
                typeof filters.priceMin === "number" ||
                typeof filters.priceMax === "number") && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {filters.q ? <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">q: {filters.q}</span> : null}
                  {filters.cat ? (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
                      categoría: {coachCategories.find((c) => c.slug === filters.cat)?.name ?? filters.cat}
                    </span>
                  ) : null}
                  {filters.location ? (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
                      ciudad: {cities.find((c) => c.slug === filters.location)?.name ?? filters.location}
                    </span>
                  ) : null}
                  {filters.session?.map((mode) => (
                    <span key={mode} className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
                      {mode}
                    </span>
                  ))}
                  {filters.certified ? (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">verificados</span>
                  ) : null}
                  {typeof filters.priceMin === "number" || typeof filters.priceMax === "number" ? (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
                      precio: {formatEuro(filters.priceMin ?? 0)} - {formatEuro(filters.priceMax ?? 500)}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {paginated.items.length ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {paginated.items.map((coach) => (
                  <CoachCard key={coach.id} coach={coach} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
                <h3 className="text-lg font-black tracking-tight text-zinc-950">No hay resultados con esos filtros</h3>
                <p className="mt-2 text-zinc-700">
                  Prueba a ampliar el presupuesto, quitar filtros o visitar una landing por categoría o ciudad.
                </p>
                <Link
                  href="/coaches"
                  className="mt-4 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Ver todos los coaches
                </Link>
              </div>
            )}

            {paginated.totalPages > 1 ? (
              <nav aria-label="Paginación" className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: paginated.totalPages }, (_, index) => index + 1).map((page) => (
                  <Link
                    key={page}
                    href={buildPaginationHref(page, raw)}
                    className={
                      page === paginated.currentPage
                        ? "rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    }
                    aria-current={page === paginated.currentPage ? "page" : undefined}
                  >
                    {page}
                  </Link>
                ))}
              </nav>
            ) : null}
          </section>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">Cómo usar el directorio</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                1. Elige especialidad o ciudad para llegar a una landing limpia e indexable.
              </li>
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                2. Compara precio, modalidad y señales de confianza antes de contactar.
              </li>
              <li className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
                3. Contacta 2–3 coaches para encontrar mejor encaje desde el principio.
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

function QuickLinkCard({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 transition hover:-translate-y-0.5 hover:bg-white"
    >
      <p className="text-sm font-black tracking-tight text-zinc-950">{title}</p>
      <p className="mt-1 text-sm text-zinc-600">{text}</p>
    </Link>
  );
}
