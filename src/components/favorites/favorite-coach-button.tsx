"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFavoriteCoaches } from "@/components/favorites/favorite-coaches-provider";

export function FavoriteCoachButton({
  coachProfileId,
  className,
}: {
  coachProfileId: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, favoriteCoachIds, toggleFavorite } = useFavoriteCoaches();

  const isFavorite = favoriteCoachIds.has(coachProfileId);

  async function onClick() {
    const result = await toggleFavorite(coachProfileId);
    if (result === "auth_required") {
      window.alert("Para guardar favoritos, inicia sesión primero.");
      const returnTo = pathname || "/coaches";
      router.push(`/iniciar-sesion?returnTo=${encodeURIComponent(returnTo)}`);
    }
    if (result === "error") {
      window.alert("No se pudo actualizar favoritos. Inténtalo de nuevo.");
    }
  }

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={onClick}
      aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 ${className ?? ""}`}
    >
      <HeartIcon filled={isFavorite} />
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${filled ? "text-rose-500" : "text-zinc-500"}`}
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
    >
      <path
        d="M12 20.4 4.9 13.9a4.9 4.9 0 0 1 0-7 5.1 5.1 0 0 1 7.2 0l.1.1.1-.1a5.1 5.1 0 0 1 7.2 0 4.9 4.9 0 0 1 0 7L12 20.4Z"
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
