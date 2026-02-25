"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type ViewerRole = "admin" | "coach" | "client" | null;

type Props = {
  coachName: string;
  coachSlug: string;
  sourcePath: string;
  isAuthenticated: boolean;
  viewerRole: ViewerRole;
};

type UnauthState = "idle" | "login_required" | "login_cta";

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 01-8 8H7l-4 2 1.2-3.8A8 8 0 1120 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 11.5h8M8 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CoachMessageBottomCta({ coachName, coachSlug, sourcePath, isAuthenticated, viewerRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [unauthState, setUnauthState] = useState<UnauthState>("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const chatHref = useMemo(() => {
    const q = new URLSearchParams({
      coachSlug,
      source: sourcePath,
    });
    return `/mi-cuenta/cliente/mensajes/nuevo?${q.toString()}`;
  }, [coachSlug, sourcePath]);

  const loginHref = useMemo(() => {
    const q = new URLSearchParams({ returnTo: sourcePath });
    return `/iniciar-sesion?${q.toString()}`;
  }, [sourcePath]);

  const isCoachViewer = isAuthenticated && viewerRole === "coach";

  const buttonLabel = (() => {
    if (isPending) return "Abriendo chat...";
    if (isCoachViewer) return "Ir a mi inbox de mensajes";
    if (!isAuthenticated) {
      if (unauthState === "login_required") return "Debes iniciar sesión";
      if (unauthState === "login_cta") return "Iniciar sesión";
    }
    return `Enviar mensaje a ${coachName}`;
  })();

  const helperText = (() => {
    if (isCoachViewer) return "La apertura desde perfiles está pensada para clientes. Te llevamos a tu inbox.";
    if (!isAuthenticated && unauthState !== "idle") return "Inicia sesión y volverás a este perfil automáticamente.";
    return null;
  })();

  function goTo(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  function handleClick() {
    if (isPending) return;

    if (isCoachViewer) {
      goTo("/mi-cuenta/coach/mensajes");
      return;
    }

    if (isAuthenticated) {
      goTo(chatHref);
      return;
    }

    if (unauthState === "login_cta") {
      goTo(loginHref);
      return;
    }

    setUnauthState("login_required");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setUnauthState("login_cta");
      timerRef.current = null;
    }, 1000);
  }

  return (
    <div className="pointer-events-none fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-30 w-[min(100%,760px)] -translate-x-1/2 px-3 sm:px-4">
      <div className="pointer-events-auto rounded-2xl border border-black/10 bg-white/92 p-2 shadow-[0_14px_42px_rgba(2,6,23,.14)] backdrop-blur">
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition sm:text-base",
            isCoachViewer && "border border-black/10 bg-zinc-100 text-zinc-800 hover:bg-zinc-200",
            !isCoachViewer && isAuthenticated && "bg-blue-600 text-white hover:bg-blue-500",
            !isCoachViewer && !isAuthenticated && unauthState === "idle" && "bg-blue-600 text-white hover:bg-blue-500",
            !isCoachViewer && !isAuthenticated && unauthState !== "idle" && "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
          )}
          aria-live="polite"
        >
          <MessageIcon />
          <span className="truncate">{buttonLabel}</span>
        </button>
        {helperText ? <p className="px-1 pt-2 text-center text-xs font-medium text-zinc-600">{helperText}</p> : null}
      </div>
    </div>
  );
}
