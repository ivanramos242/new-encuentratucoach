import Image from "next/image";
import Link from "next/link";
import { getCoachCategoryLabel } from "@/lib/coach-category-catalog";
import { getCoachAverageRating } from "@/lib/directory";
import { formatEuro } from "@/lib/utils";
import type { CoachProfile } from "@/types/domain";

export function CoachCard({ coach }: { coach: CoachProfile }) {
  const rating = getCoachAverageRating(coach);
  const categoryLabels = coach.categories
    .map((slug) => getCoachCategoryLabel(slug) ?? slug)
    .slice(0, 2);

  return (
    <article className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/10] bg-zinc-100">
        <Image
          src={coach.heroImageUrl}
          alt={`Imagen de ${coach.name}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
          {coach.certifiedStatus === "approved" ? (
            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              Certificado
            </span>
          ) : null}
          {coach.sessionModes.map((mode) => (
            <span
              key={mode}
              className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold capitalize text-white backdrop-blur"
            >
              {mode}
            </span>
          ))}
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {categoryLabels.map((label) => (
            <span key={label} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
              {label}
            </span>
          ))}
        </div>

        <h3 className="mt-3 text-lg font-black tracking-tight text-zinc-950">
          <Link href={`/coaches/${coach.slug}`} className="hover:text-cyan-700">
            {coach.name}
          </Link>
        </h3>

        <p className="mt-1 text-sm text-zinc-600">{coach.cityLabel}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-700">{coach.bio}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-500">Desde</div>
            <div className="text-lg font-black tracking-tight text-zinc-950">
              {formatEuro(coach.basePriceEur)}
              <span className="ml-1 text-sm font-semibold text-zinc-500">/ sesión</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-zinc-500">Valoración</div>
            <div className="text-sm font-black text-zinc-900">
              {rating > 0 ? rating.toFixed(1) : "Sin reseñas"}
              {rating > 0 ? ` · ${coach.reviews.length} reseñas` : ""}
            </div>
          </div>
        </div>

        <Link
          href={`/coaches/${coach.slug}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Ver perfil
        </Link>
      </div>
    </article>
  );
}
