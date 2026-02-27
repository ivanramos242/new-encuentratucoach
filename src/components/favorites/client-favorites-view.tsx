"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FavoriteCoachButton } from "@/components/favorites/favorite-coach-button";
import { coaches } from "@/lib/mock-data";
import { getFavoriteCoachIds, setClientMockAuthenticated } from "@/lib/favorites-client";
import { formatEuro } from "@/lib/utils";

export function ClientFavoritesView() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    // In this V1 mock, opening client account marks a basic client session in local storage.
    setClientMockAuthenticated(true);
    setFavoriteIds(getFavoriteCoachIds());

    const sync = () => setFavoriteIds(getFavoriteCoachIds());
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("etc:favorites:changed", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("etc:favorites:changed", sync);
    };
  }, []);

  const favorites = useMemo(() => {
    const idSet = new Set(favoriteIds);
    return coaches.filter((coach) => idSet.has(coach.id));
  }, [favoriteIds]);

  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Coaches favoritos</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Guarda perfiles para compararlos despues. Desde aqui puedes abrir cada perfil o quitarlo de favoritos.
          </p>
        </div>
        <Link
          href="/coaches"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Explorar coaches
        </Link>
      </div>

      {favorites.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((coach) => (
            <article key={coach.id} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
              <div className="relative aspect-[16/10] bg-zinc-100">
                <Image
                  src={coach.heroImageUrl}
                  alt={`Imagen de ${coach.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-4">
                <h3 className="text-base font-black tracking-tight text-zinc-950">{coach.name}</h3>
                <p className="mt-1 text-sm text-zinc-600">{coach.cityLabel}</p>
                <p className="mt-2 text-sm text-zinc-700">{formatEuro(coach.basePriceEur)} / sesion</p>
                <div className="mt-4 flex items-center gap-2">
                  <FavoriteCoachButton coachId={coach.id} />
                  <Link
                    href={`/coaches/${coach.slug}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Ver perfil
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-5 text-sm text-zinc-700">
          Aun no has guardado coaches en favoritos. Ve al directorio y pulsa el icono del corazon para empezar.
        </div>
      )}
    </section>
  );
}
