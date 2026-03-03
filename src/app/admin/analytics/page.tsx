import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { cities } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

const EVENT_KEYS = ["view_profile", "click_whatsapp", "click_contact", "submit_form", "booking_start"] as const;
const LANDING_TYPES = ["directory", "city", "category", "category_city", "online", "certified"] as const;
const DAY_OPTIONS = [7, 14, 30] as const;

type EventKey = (typeof EVENT_KEYS)[number];

function pick(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

function safeDays(input: string | undefined) {
  const parsed = Number(input);
  return DAY_OPTIONS.includes(parsed as (typeof DAY_OPTIONS)[number]) ? parsed : 7;
}

function safeLandingType(input: string | undefined) {
  if (!input) return "";
  return LANDING_TYPES.includes(input as (typeof LANDING_TYPES)[number]) ? input : "";
}

function ratio(numerator: number, denominator: number) {
  if (!denominator) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function toStartDate(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
}

function eventCounterSeed() {
  return {
    view_profile: 0,
    click_whatsapp: 0,
    click_contact: 0,
    submit_form: 0,
    booking_start: 0,
  } satisfies Record<EventKey, number>;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const sp = await searchParams;
  const days = safeDays(pick(sp.days));
  const cityFilter = pick(sp.city) || "";
  const landingTypeFilter = safeLandingType(pick(sp.landingType));

  const currentStart = toStartDate(days);
  const previousStart = toStartDate(days * 2);

  const events = process.env.DATABASE_URL
    ? await prisma.directoryFunnelEvent.findMany({
        where: {
          createdAt: { gte: previousStart },
          ...(cityFilter ? { citySlug: cityFilter } : {}),
          ...(landingTypeFilter
            ? { landingType: landingTypeFilter as (typeof LANDING_TYPES)[number] }
            : {}),
        },
        select: {
          id: true,
          eventType: true,
          landingPath: true,
          landingType: true,
          citySlug: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const current = events.filter((event) => event.createdAt >= currentStart);
  const previous = events.filter((event) => event.createdAt < currentStart);

  const currentTotals = eventCounterSeed();
  const previousTotals = eventCounterSeed();

  for (const event of current) currentTotals[event.eventType] += 1;
  for (const event of previous) previousTotals[event.eventType] += 1;

  const byLanding = new Map<
    string,
    {
      landingPath: string;
      citySlug: string;
      landingType: string;
      counts: Record<EventKey, number>;
    }
  >();

  for (const event of current) {
    const landingPath = event.landingPath || "sin-atribucion";
    const citySlug = event.citySlug || "-";
    const landingType = event.landingType || "sin-atribucion";
    const key = `${landingPath}::${citySlug}`;
    const row = byLanding.get(key) ?? {
      landingPath,
      citySlug,
      landingType,
      counts: eventCounterSeed(),
    };
    row.counts[event.eventType] += 1;
    byLanding.set(key, row);
  }

  const rows = Array.from(byLanding.values()).sort((a, b) => {
    if (b.counts.view_profile !== a.counts.view_profile) {
      return b.counts.view_profile - a.counts.view_profile;
    }
    return b.counts.booking_start - a.counts.booking_start;
  });

  const cityOptions = Array.from(
    new Set(events.map((event) => event.citySlug).filter((slug): slug is string => Boolean(slug))),
  ).sort((a, b) => a.localeCompare(b, "es"));

  const cityLabelBySlug = new Map(cities.map((city) => [city.slug, city.name]));

  return (
    <>
      <PageHero
        badge="Admin"
        title="Analytics de conversion por landing"
        description="Embudo semanal por landing y ciudad para optimizar conversion y decisiones SEO con datos reales."
      />
      <PageShell className="pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <form className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-1 text-sm font-semibold text-zinc-800">
              Ventana
              <select
                name="days"
                defaultValue={String(days)}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-cyan-400"
              >
                {DAY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    Ultimos {option} dias
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-zinc-800">
              Ciudad
              <select
                name="city"
                defaultValue={cityFilter}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-cyan-400"
              >
                <option value="">Todas</option>
                {cityOptions.map((slug) => (
                  <option key={slug} value={slug}>
                    {cityLabelBySlug.get(slug) || slug}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-zinc-800">
              Tipo landing
              <select
                name="landingType"
                defaultValue={landingTypeFilter}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-cyan-400"
              >
                <option value="">Todos</option>
                {LANDING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
                Aplicar
              </button>
              <Link
                href="/admin/analytics"
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {EVENT_KEYS.map((key) => (
            <article key={key} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{key}</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
                {currentTotals[key].toLocaleString("es-ES")}
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Prev: {previousTotals[key].toLocaleString("es-ES")}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Embudo por landing y ciudad</h2>
          <p className="mt-1 text-sm text-zinc-700">
            Ratios sobre <strong>view_profile</strong> en la ventana activa.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="pb-2 pr-4">Landing</th>
                  <th className="pb-2 pr-4">Ciudad</th>
                  <th className="pb-2 pr-4">Tipo</th>
                  <th className="pb-2 pr-4">Views</th>
                  <th className="pb-2 pr-4">WA clicks</th>
                  <th className="pb-2 pr-4">Contact clicks</th>
                  <th className="pb-2 pr-4">Submit form</th>
                  <th className="pb-2 pr-4">Booking start</th>
                  <th className="pb-2 pr-4">WA/View</th>
                  <th className="pb-2 pr-4">Contact/View</th>
                  <th className="pb-2 pr-4">Submit/View</th>
                  <th className="pb-2">Booking/View</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row) => (
                    <tr key={`${row.landingPath}-${row.citySlug}`} className="border-t border-black/5">
                      <td className="py-2 pr-4 font-mono text-xs text-zinc-700">{row.landingPath}</td>
                      <td className="py-2 pr-4">{row.citySlug === "-" ? "-" : cityLabelBySlug.get(row.citySlug) || row.citySlug}</td>
                      <td className="py-2 pr-4">{row.landingType}</td>
                      <td className="py-2 pr-4">{row.counts.view_profile}</td>
                      <td className="py-2 pr-4">{row.counts.click_whatsapp}</td>
                      <td className="py-2 pr-4">{row.counts.click_contact}</td>
                      <td className="py-2 pr-4">{row.counts.submit_form}</td>
                      <td className="py-2 pr-4">{row.counts.booking_start}</td>
                      <td className="py-2 pr-4">{ratio(row.counts.click_whatsapp, row.counts.view_profile)}</td>
                      <td className="py-2 pr-4">{ratio(row.counts.click_contact, row.counts.view_profile)}</td>
                      <td className="py-2 pr-4">{ratio(row.counts.submit_form, row.counts.view_profile)}</td>
                      <td className="py-2">{ratio(row.counts.booking_start, row.counts.view_profile)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="py-4 text-sm text-zinc-700">
                      No hay eventos para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </PageShell>
    </>
  );
}
