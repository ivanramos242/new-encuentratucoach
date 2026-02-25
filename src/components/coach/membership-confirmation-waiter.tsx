"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SessionPayload = {
  ok?: boolean;
  authenticated?: boolean;
  user?: { role?: "admin" | "coach" | "client" } | null;
};

export function MembershipConfirmationWaiter() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "waiting" | "ready" | "error">("checking");
  const [message, setMessage] = useState("Comprobando el estado del pago y la activación de tu cuenta de coach...");
  const [ticks, setTicks] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  const canShowRetry = useMemo(() => ticks >= 12, [ticks]);

  useEffect(() => {
    let cancelled = false;
    let interval: number | null = null;

    const check = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "cache-control": "no-store" },
        });
        const json = (await res.json()) as SessionPayload;
        if (cancelled) return;

        if (!json.authenticated) {
          setState("error");
          setMessage("Tu sesión no está activa. Inicia sesión para continuar.");
          if (interval) window.clearInterval(interval);
          return;
        }

        if (json.user?.role === "coach" || json.user?.role === "admin") {
          setState("ready");
          setMessage("Pago confirmado. Redirigiendo a tu área de membresía...");
          if (interval) window.clearInterval(interval);
          setTimeout(() => {
            router.replace("/mi-cuenta/coach/membresia?checkout=success");
            router.refresh();
          }, 500);
          return;
        }

        setState("waiting");
        setMessage("Estamos comprobando la confirmación de Stripe y activando tu cuenta de coach (puede tardar unos segundos).");
      } catch {
        if (cancelled) return;
        setState("error");
        setMessage("No hemos podido confirmar el estado del pago. Puedes reintentar o volver a membresía.");
        if (interval) window.clearInterval(interval);
      }
    };

    void check();
    interval = window.setInterval(() => {
      setTicks((v) => v + 1);
      void check();
    }, 2500);

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [retryKey, router]);

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-black tracking-tight text-zinc-950">Confirmando tu membresía</h1>
      <p className="mt-3 text-zinc-700">{message}</p>

      <div className="mt-5 rounded-2xl border border-black/10 bg-zinc-50 p-4">
        <div className="flex items-center gap-3">
          <span
            className={
              state === "error"
                ? "inline-flex h-3 w-3 rounded-full bg-rose-500"
                : "inline-flex h-3 w-3 animate-pulse rounded-full bg-cyan-500"
            }
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-zinc-700">
            {state === "ready"
              ? "Listo"
              : state === "error"
                ? "Necesita acción"
                : state === "waiting"
                  ? "Webhook Stripe en proceso"
                  : "Comprobando estado"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setState("checking");
            setMessage("Volviendo a comprobar el estado del pago...");
            setTicks(0);
            setRetryKey((v) => v + 1);
          }}
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Reintentar comprobación
        </button>
        <Link
          href="/membresia"
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Volver a membresía
        </Link>
      </div>

      {canShowRetry ? (
        <p className="mt-3 text-xs text-zinc-500">
          Si el webhook se retrasa, espera unos segundos más. Cuando se active tu cuenta, te redirigiremos automáticamente.
        </p>
      ) : null}
    </div>
  );
}
