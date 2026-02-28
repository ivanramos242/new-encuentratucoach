import Link from "next/link";
import { type Metadata } from "next";
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

async function getOnlineLandingData() {
  const coaches = await listPublicCoachesMerged();
  const items = coaches.filter((coach) => coach.sessionModes.includes("online"));
  const minToIndex = getSeoMinCoachesIndexable();
  const noindex = shouldNoIndexLanding({ coachCount: items.length, hasEditorialContent: true });

  const topCategories = Array.from(
    items.reduce((acc, coach) => {
      for (const categorySlug of coach.categories) {
        acc.set(categorySlug, (acc.get(categorySlug) ?? 0) + 1);
      }
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug]) => ({ slug, name: getCategoryBySlug(slug)?.name ?? slug }));

  const topCities = Array.from(
    items.reduce((acc, coach) => {
      acc.set(coach.citySlug, (acc.get(coach.citySlug) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug]) => ({ slug, name: getCityBySlug(slug)?.name ?? slug }));

  return { items, noindex, minToIndex, topCategories, topCities };
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getOnlineLandingData();
  return buildMetadata({
    title: "Coaching online en España",
    description: "Encuentra coaches online en España por especialidad, precio, certificacion y experiencia.",
    path: "/coaches/modalidad/online",
    noindex: data.noindex,
  });
}

export default async function OnlineCoachingPage() {
  const data = await getOnlineLandingData();
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
    { name: "Coaching online", path: "/coaches/modalidad/online" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PageHero
        badge="Landing curada por modalidad"
        title="Coaching online en España"
        description="Compara coaches que trabajan online y contacta de forma directa segun tu objetivo."
      />
      <PageShell className="space-y-6 pt-8">
        {data.noindex ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Esta landing no se indexa todavia porque no alcanza {data.minToIndex} perfiles.
          </section>
        ) : null}

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Cuando elegir modalidad online</h2>
          <p className="mt-2 text-zinc-700">
            Ideal si buscas flexibilidad de horarios, mas oferta de perfiles y continuidad sin desplazamientos.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Ventaja principal</p>
              <p className="mt-1 text-sm text-zinc-700">Mas opciones por especialidad y ciudad sin friccion logistica.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-900">Que revisar</p>
              <p className="mt-1 text-sm text-zinc-700">Frecuencia de sesiones, canal, seguimiento y objetivos medibles.</p>
            </div>
          </div>
        </section>

        {data.topCategories.length ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Especialidades con sesion online</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.topCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/coaches/categoria/${category.slug}`}
                  className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {data.topCities.length ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Ciudades con mas oferta online</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.topCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/coaches/ciudad/${city.slug}`}
                  className="rounded-full border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="sr-only">Listado de coaches online</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.items.length ? data.items.map((coach) => <CoachCard key={coach.id} coach={coach} />) : <p>No hay coaches.</p>}
          </div>
        </section>
      </PageShell>
    </>
  );
}
