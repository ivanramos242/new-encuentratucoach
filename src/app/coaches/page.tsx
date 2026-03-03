import Link from "next/link";
import type { Metadata } from "next";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import {
  PAGE_SIZE,
  filterAndSortCoachesFrom,
  getCategoryBySlug,
  paginateCoaches,
  parseDirectoryFilters,
} from "@/lib/directory";
import { cities } from "@/lib/mock-data";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { buildMetadata, hasMeaningfulQueryParams } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";
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

function getMeaningfulFilterKeys(filters: ReturnType<typeof parseDirectoryFilters>) {
  const keys: string[] = [];
  if (filters.q) keys.push("q");
  if (filters.cat) keys.push("cat");
  if (filters.location) keys.push("location");
  if (filters.session?.length) keys.push("session");
  if (filters.certified) keys.push("certified");
  if (filters.idioma) keys.push("idioma");
  if (typeof filters.priceMin === "number") keys.push("priceMin");
  if (typeof filters.priceMax === "number") keys.push("priceMax");
  return keys;
}

function resolveCanonicalForDirectory(input: {
  filters: ReturnType<typeof parseDirectoryFilters>;
  citySlug?: string | null;
  categorySlug?: string | null;
}) {
  const keys = new Set(getMeaningfulFilterKeys(input.filters));
  if (keys.size === 0) return "/coaches";

  const onlyCatOrLocation = Array.from(keys).every((key) => key === "cat" || key === "location");
  if (!onlyCatOrLocation) return "/coaches";

  if (input.categorySlug && input.citySlug) return `/coaches/categoria/${input.categorySlug}/${input.citySlug}`;
  if (input.categorySlug) return `/coaches/categoria/${input.categorySlug}`;
  if (input.citySlug) return `/coaches/ciudad/${input.citySlug}`;
  return "/coaches";
}

function FiltersForm({
  filters,
  availableCategorySlugs,
}: {
  filters: ReturnType<typeof parseDirectoryFilters>;
  availableCategorySlugs: string[];
}) {
  return (
    <form action="/coaches" className="mt-6 grid gap-5" aria-label="Formulario de filtros">
      <section className="grid gap-3 rounded-2xl border border-black/10 bg-zinc-50/60 p-4">
        <label className="grid gap-1 text-sm font-semibold text-zinc-800">
          <span className="inline-flex items-center gap-2">
            <i className="fa-solid fa-magnifying-glass text-zinc-500" aria-hidden="true" />
            Buscar
          </span>
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Ciudad, especialidad o nombre"
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-cyan-400"
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold text-zinc-800">
          <span className="inline-flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-zinc-500" aria-hidden="true" />
            Categoría
          </span>
          <select
            name="cat"
            defaultValue={filters.cat ?? ""}
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-cyan-400"
          >
            <option value="">Todas</option>
            {availableCategorySlugs.map((categorySlug) => (
              <option key={categorySlug} value={categorySlug}>
                {getCategoryBySlug(categorySlug)?.name ?? categorySlug}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-semibold text-zinc-800">
          <span className="inline-flex items-center gap-2">
            <i className="fa-solid fa-location-dot text-zinc-500" aria-hidden="true" />
            Ciudad
          </span>
          <select
            name="location"
            defaultValue={filters.location ?? ""}
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-cyan-400"
          >
            <option value="">Toda España</option>
            {cities.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-3 rounded-2xl border border-black/10 bg-zinc-50/60 p-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <i className="fa-solid fa-sliders text-zinc-500" aria-hidden="true" />
          Modalidad y confianza
        </p>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="session" value="online" defaultChecked={filters.session?.includes("online")} />
          <i className="fa-solid fa-globe text-zinc-500" aria-hidden="true" />
          Online
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="session" value="presencial" defaultChecked={filters.session?.includes("presencial")} />
          <i className="fa-solid fa-building text-zinc-500" aria-hidden="true" />
          Presencial
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="certified" value="certified" defaultChecked={filters.certified} />
          <i className="fa-solid fa-circle-check text-zinc-500" aria-hidden="true" />
          Solo coaches certificados
        </label>
      </section>

      <section className="grid gap-3 rounded-2xl border border-black/10 bg-zinc-50/60 p-4">
        <label className="grid gap-1 text-sm font-semibold text-zinc-800">
          <span className="inline-flex items-center gap-2">
            <i className="fa-solid fa-language text-zinc-500" aria-hidden="true" />
            Idioma
          </span>
          <input
            name="idioma"
            defaultValue={filters.idioma}
            placeholder="Ej: inglés"
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-cyan-400"
          />
        </label>

        <div className="grid gap-3 rounded-xl border border-black/10 bg-white p-3">
          <div className="flex items-center justify-between text-sm font-semibold text-zinc-800">
            <span className="inline-flex items-center gap-2">
              <i className="fa-solid fa-euro-sign text-zinc-500" aria-hidden="true" />
              Precio por sesión
            </span>
            <span className="text-xs font-semibold text-zinc-600">
              {formatEuro(filters.priceMin ?? 0)} - {formatEuro(filters.priceMax ?? 500)}
            </span>
          </div>

          <label className="grid gap-1 text-sm text-zinc-700">
            <span>Mínimo: {formatEuro(filters.priceMin ?? 0)}</span>
            <input
              type="range"
              name="price_min"
              min={0}
              max={500}
              step={5}
              defaultValue={filters.priceMin ?? 0}
              className="accent-zinc-900"
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-700">
            <span>Máximo: {formatEuro(filters.priceMax ?? 500)}</span>
            <input
              type="range"
              name="price_max"
              min={0}
              max={500}
              step={5}
              defaultValue={filters.priceMax ?? 500}
              className="accent-zinc-900"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-semibold text-zinc-800">
          <span className="inline-flex items-center gap-2">
            <i className="fa-solid fa-arrow-down-wide-short text-zinc-500" aria-hidden="true" />
            Ordenar
          </span>
          <select
            name="sort"
            defaultValue={filters.sort ?? "recent"}
            className="rounded-xl border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-cyan-400"
          >
            <option value="recent">Más recientes</option>
            <option value="price_asc">Precio ascendente</option>
            <option value="price_desc">Precio descendente</option>
            <option value="rating_desc">Mejor valoración</option>
          </select>
        </label>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button className="flex-1 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
          Aplicar filtros
        </button>
        <Link
          href="/coaches"
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Limpiar
        </Link>
      </div>
    </form>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}): Promise<Metadata> {
  const raw = await searchParams;
  const filters = parseDirectoryFilters(raw);
  const category = filters.cat ? getCategoryBySlug(filters.cat) : null;
  const locationSlug = filters.location?.toLowerCase();
  const city = locationSlug ? cities.find((item) => item.slug === locationSlug) : null;
  const title =
    category && city
      ? `${category.name} en ${city.name}`
      : category
        ? category.name
        : city
          ? `Coaches en ${city.name}`
          : "Directorio de coaches en España";

  const noindex = hasMeaningfulQueryParams(raw);
  const canonicalPath = resolveCanonicalForDirectory({
    filters,
    citySlug: city?.slug ?? null,
    categorySlug: category?.slug ?? null,
  });

  return buildMetadata({
    title,
    description:
      "Directorio de coaches en España para buscar por ciudad, especialidad, modalidad y presupuesto.",
    path: "/coaches",
    canonicalUrl: `${getSiteBaseUrl()}${canonicalPath}`,
    noindex,
    keywords: [
      "directorio de coaches",
      "buscar coach",
      "coach madrid",
      "coach barcelona",
      "coach online",
      "coaching personal",
      "coaching carrera",
      "coaching liderazgo",
    ],
  });
}

export default async function CoachesDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const raw = await searchParams;
  const filters = parseDirectoryFilters(raw);
  const sourceCoaches = await listPublicCoachesMerged();
  const availableCategorySlugs = [...new Set(sourceCoaches.flatMap((coach) => coach.categories))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  const allResults = filterAndSortCoachesFrom(sourceCoaches, filters);
  const paginated = paginateCoaches(allResults, filters.page ?? 1, PAGE_SIZE);
  const hasFilters = hasMeaningfulQueryParams(raw);
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Directorio de coaches",
    description: "Listado de coaches en España con filtros avanzados y enlaces a landings canónicas.",
  };

  return (
    <>
      <JsonLd data={schema} />
      <PageHero
        badge="Directorio de coaches"
        title="Encuentra coaches en España"
        description="Filtra por especialidad, ciudad, modalidad, presupuesto e idiomas. Contacta directamente y compara perfiles antes de elegir."
      />

      <PageShell className="pt-8" containerClassName="max-w-[1760px] lg:px-10">
        <div className="grid gap-8 max-[390px]:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6 xl:sticky xl:top-24">
            <div className="xl:hidden">
              <details className="group rounded-2xl border border-black/10 bg-zinc-50/40 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900">
                  <span className="inline-flex items-center gap-2">
                    <i className="fa-solid fa-filter text-zinc-500" aria-hidden="true" />
                    Ver filtros
                  </span>
                  <i
                    className="fa-solid fa-chevron-down text-xs text-zinc-500 transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <FiltersForm filters={filters} availableCategorySlugs={availableCategorySlugs} />
              </details>
            </div>

            <div className="hidden xl:block">
              <h2 className="text-xl font-black tracking-tight text-zinc-950">Filtros</h2>
              <p className="mt-1 text-sm text-zinc-600">Diseñados para encontrar encaje rápido.</p>
              <FiltersForm filters={filters} availableCategorySlugs={availableCategorySlugs} />
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-zinc-950">
                    {allResults.length} {allResults.length === 1 ? "resultado" : "resultados"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {hasFilters
                      ? "Resultados según los filtros seleccionados."
                      : "Explora el listado y entra a las especialidades o ciudades que mejor encajen contigo."}
                  </p>
                </div>
                <div className="w-full text-left text-sm text-zinc-600 sm:w-auto sm:text-right">
                  <p>
                    Página {paginated.currentPage} de {paginated.totalPages}
                  </p>
                  <p>{PAGE_SIZE} por página</p>
                </div>
              </div>

              {(filters.q ||
                filters.cat ||
                filters.location ||
                filters.certified ||
                filters.idioma ||
                filters.session?.length ||
                filters.priceMin ||
                filters.priceMax) && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-4">
                  {filters.q ? <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">q: {filters.q}</span> : null}
                  {filters.cat ? (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
                      categoría: {getCategoryBySlug(filters.cat)?.name ?? filters.cat}
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
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">certificados</span>
                  ) : null}
                  {typeof filters.priceMin === "number" || typeof filters.priceMax === "number" ? (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
                      precio: {formatEuro(filters.priceMin ?? 0)} - {formatEuro(filters.priceMax ?? 500)}
                    </span>
                  ) : null}
                  <Link href="/coaches" className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm font-semibold text-zinc-800 hover:bg-zinc-50">
                    Limpiar todo
                  </Link>
                </div>
              )}
            </div>

            {paginated.items.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {paginated.items.map((coach) => (
                  <CoachCard key={coach.id} coach={coach} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
                <h3 className="text-lg font-black tracking-tight text-zinc-950">No hay resultados con esos filtros</h3>
                <p className="mt-2 text-zinc-700">
                  Prueba a ampliar el presupuesto, quitar filtros o ir a una landing por categoría/ciudad.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/coaches"
                    className="inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Ver todos los coaches
                  </Link>
                  <Link
                    href="/coaches/ciudad/madrid"
                    className="inline-flex rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Coaches en Madrid
                  </Link>
                </div>
              </div>
            )}

            {paginated.totalPages > 1 ? (
              <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-2">
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
      </PageShell>
    </>
  );
}


