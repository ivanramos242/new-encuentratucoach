"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFavoriteCoaches } from "@/components/favorites/favorite-coaches-provider";
import { getViewedCoachProfileIds } from "@/lib/directory-funnel-client";

export function DirectoryShortlistCta() {
  const { authenticated, favoriteCoachIds, ready } = useFavoriteCoaches();
  const [viewedCount] = useState(() => getViewedCoachProfileIds().length);
  const [dismissed, setDismissed] = useState(false);

  const favoriteCount = favoriteCoachIds.size;
  const shouldShow = useMemo(() => {
    if (dismissed || !ready) return false;
    return favoriteCount >= 2 || viewedCount >= 3;
  }, [dismissed, favoriteCount, ready, viewedCount]);

  if (!shouldShow) return null;

  const title =
    favoriteCount >= 2
      ? `Ya tienes ${favoriteCount} coaches guardados para comparar`
      : `Has visto ${viewedCount} perfiles: conviene hacer una shortlist`;

  const description =
    favoriteCount >= 2
      ? "Ve a tus favoritos y compara propuesta, precio y modalidad antes de contactar."
      : "Guarda tus opciones favoritas para comparar con más criterio y no perderlas.";

  const href = authenticated ? "/mi-cuenta/cliente#favoritos" : "/registro?intent=client";
  const ctaLabel = authenticated ? "Ver mi shortlist" : "Crear cuenta y guardar";

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(16px+env(safe-area-inset-bottom))] z-30 sm:inset-x-auto sm:right-4 sm:w-[420px]">
      <div className="pointer-events-auto rounded-2xl border border-black/10 bg-white/95 p-4 shadow-[0_16px_42px_rgba(2,6,23,.14)] backdrop-blur">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs font-semibold text-zinc-500 hover:bg-zinc-100"
          aria-label="Cerrar recomendación"
        >
          Cerrar
        </button>
        <p className="pr-10 text-base font-black tracking-tight text-zinc-950">{title}</p>
        <p className="mt-2 text-sm leading-6 text-zinc-700">{description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={href}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            {ctaLabel}
          </Link>
          <Link
            href="/coaches"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Seguir comparando
          </Link>
        </div>
      </div>
    </div>
  );
}
