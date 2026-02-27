"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isClientMockAuthenticated, isCoachFavorite, setCoachFavorite } from "@/lib/favorites-client";

export function FavoriteCoachButton({
  coachId,
  className,
  size = "md",
}: {
  coachId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [favorite, setFavorite] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setFavorite(isCoachFavorite(coachId));
    sync();
    setReady(true);

    const onStorage = () => sync();
    const onChanged = () => sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("etc:favorites:changed", onChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("etc:favorites:changed", onChanged);
    };
  }, [coachId]);

  function onToggle() {
    if (!isClientMockAuthenticated()) {
      window.alert("Para guardar coaches en favoritos, inicia sesion primero.");
      const returnTo = pathname || "/coaches";
      router.push(`/iniciar-sesion?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    const nextValue = !favorite;
    setFavorite(nextValue);
    setCoachFavorite(coachId, nextValue);
  }

  const base =
    size === "sm"
      ? "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-800 hover:bg-zinc-50"
      : "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-800 hover:bg-zinc-50";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      title={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`${base} ${className ?? ""}`}
      disabled={!ready}
    >
      <HeartIcon filled={favorite} />
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${filled ? "text-rose-500" : "text-zinc-500"}`} fill={filled ? "currentColor" : "none"} aria-hidden="true">
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
