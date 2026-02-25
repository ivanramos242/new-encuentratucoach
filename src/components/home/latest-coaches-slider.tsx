"use client";

import { useRef } from "react";
import { CoachCard } from "@/components/directory/coach-card";
import type { CoachProfile } from "@/types/domain";

function ArrowIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      {dir === "left" ? (
        <path d="M14.5 5 8 12l6.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9.5 5 16 12l-6.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function LatestCoachesSlider({ coaches }: { coaches: CoachProfile[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function scrollByCards(direction: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(320, Math.round(el.clientWidth * 0.9));
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  if (!coaches.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-zinc-50 p-6 text-sm text-zinc-700">
        Todavía no hay coaches publicados para mostrar en portada.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByCards("left")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900 hover:bg-zinc-50"
          aria-label="Desplazar a la izquierda"
        >
          <ArrowIcon dir="left" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards("right")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-900 hover:bg-zinc-50"
          aria-label="Desplazar a la derecha"
        >
          <ArrowIcon dir="right" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Últimos perfiles añadidos"
      >
        {coaches.map((coach) => (
          <div key={coach.id} className="min-w-[86%] snap-start sm:min-w-[420px] lg:min-w-[380px] xl:min-w-[360px]">
            <CoachCard coach={coach} />
          </div>
        ))}
      </div>
    </div>
  );
}
