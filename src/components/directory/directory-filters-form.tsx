"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cities } from "@/lib/mock-data";
import { formatEuro } from "@/lib/utils";
import type { DirectoryFilters } from "@/types/domain";

type CategoryOption = {
  slug: string;
  label: string;
};

export function DirectoryFiltersForm({
  filters,
  categories,
}: {
  filters: DirectoryFilters;
  categories: CategoryOption[];
}) {
  const initialMin = typeof filters.priceMin === "number" ? filters.priceMin : 0;
  const initialMax = typeof filters.priceMax === "number" ? filters.priceMax : 500;
  const [priceMin, setPriceMin] = useState(initialMin);
  const [priceMax, setPriceMax] = useState(initialMax);

  const rangeLabel = useMemo(() => `${formatEuro(priceMin)} - ${formatEuro(priceMax)}`, [priceMin, priceMax]);

  return (
    <form action="/coaches" className="mt-6 grid gap-5" aria-label="Formulario de filtros">
      <input type="hidden" name="sort" value={filters.sort ?? "recent"} />

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
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
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
            <span className="text-xs font-semibold text-zinc-600">{rangeLabel}</span>
          </div>

          <label className="grid gap-1 text-sm text-zinc-700">
            <span>Mínimo: {formatEuro(priceMin)}</span>
            <input
              type="range"
              name="price_min"
              min={0}
              max={500}
              step={5}
              value={priceMin}
              onChange={(event) => {
                const nextMin = Number(event.currentTarget.value);
                setPriceMin(Math.min(nextMin, priceMax));
              }}
              className="accent-zinc-900"
            />
          </label>

          <label className="grid gap-1 text-sm text-zinc-700">
            <span>Máximo: {formatEuro(priceMax)}</span>
            <input
              type="range"
              name="price_max"
              min={0}
              max={500}
              step={5}
              value={priceMax}
              onChange={(event) => {
                const nextMax = Number(event.currentTarget.value);
                setPriceMax(Math.max(nextMax, priceMin));
              }}
              className="accent-zinc-900"
            />
          </label>
        </div>
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
