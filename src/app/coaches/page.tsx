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
          : "Nuestros coaches";

  const noindex = hasMeaningfulQueryParams(raw);
  const canonicalPath = resolveCanonicalForDirectory({
    filters,
    citySlug: city?.slug ?? null,
    categorySlug: category?.slug ?? null,
  });

  return buildMetadata({
    title,
    description:
      "Explora coaches por especialidad, ciudad, modalidad, certificacion, idioma y presupuesto. Directorio SEO para España.",
    path: "/coaches",
    canonicalUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${canonicalPath}`,
    noindex,
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
  const canonicalPath = resolveCanonicalForDirectory({
    filters,
    citySlug: filters.location ?? null,
    categorySlug: filters.cat ?? null,
  });

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Directorio de coaches",
    description: "Listado de coaches en España con filtros avanzados.",
  };

  return (
    <>
      <JsonLd data={schema} />
      <PageHero
        badge="Directorio SEO · filtros avanzados"
        title="Encuentra coaches en España"
        description="Filtra por especialidad, ciudad, modalidad, presupuesto e idiomas. Contacta directamente y compara perfiles antes de elegir."
      />

      <PageShell className="pt-8">
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
                Categoria
                <select
                  name="cat"
                  defaultValue={filters.cat ?? ""}
                  className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
                >
                  <option value="">Todas</option>
                  {availableCategorySlugs.map((categorySlug) => (
                    <option key={categorySlug} value={categorySlug}>
                      {getCategoryBySlug(categorySlug)?.name ?? categorySlug}
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
                Solo coaches certificados
              </label>

              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Idioma
                <input
                  name="idioma"
                  defaultValue={filters.idioma}
                  placeholder="Ej: ingles"
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
                  <option value="recent">Mas recientes</option>
                  <option value="price_asc">Precio ascendente</option>
                  <option value="price_desc">Precio descendente</option>
                  <option value="rating_desc">Mejor valoracion</option>
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
                    {hasFilters
                      ? "Esta URL con filtros se publica como noindex y apunta a una landing canonica."
                      : "Listado principal indexable del directorio."}
                  </p>
                </div>
                <div className="text-right text-sm text-zinc-600">
                  <p>
                    Pagina {paginated.currentPage} de {paginated.totalPages}
                  </p>
                  <p>{PAGE_SIZE} por pagina</p>
                </div>
              </div>

              {hasFilters && canonicalPath !== "/coaches" ? (
                <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                  Landing canonica recomendada:{" "}
                  <Link href={canonicalPath} className="font-semibold underline">
                    {canonicalPath}
                  </Link>
                </div>
              ) : null}

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
                      categoria: {getCategoryBySlug(filters.cat)?.name ?? filters.cat}
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
                  Prueba a ampliar el presupuesto, quitar filtros o buscar por una categoria distinta.
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
              <nav aria-label="Paginacion" className="mt-8 flex flex-wrap items-center justify-center gap-2">
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
