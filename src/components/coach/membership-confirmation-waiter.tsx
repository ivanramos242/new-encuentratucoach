"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_PENDING_WINDOW_MS = 3 * 60 * 1000;

type SessionPayload = {
  ok?: boolean;
  authenticated?: boolean;
  user?: { role?: "admin" | "coach" | "client" } | null;
};

function formatTimer(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function MembershipConfirmationWaiter({
  retryPaymentHref = "/membresia",
  pendingUntilEpochMs,
}: {
  retryPaymentHref?: string;
  pendingUntilEpochMs: number;
}) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "waiting" | "ready" | "error">("checking");
  const [message, setMessage] = useState("Comprobando el estado del pago y la activación de tu cuenta de coach...");
  const [ticks, setTicks] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [remainingMs, setRemainingMs] = useState(DEFAULT_PENDING_WINDOW_MS);

  const canShowRetry = useMemo(() => ticks >= 12, [ticks]);
  const deadlineMs = pendingUntilEpochMs;

  useEffect(() => {
    const updateRemaining = () => {
      setRemainingMs(Math.max(0, deadlineMs - Date.now()));
    };
    const firstTick = window.setTimeout(updateRemaining, 0);
    const timer = window.setInterval(() => {
      updateRemaining();
    }, 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, [deadlineMs]);

  useEffect(() => {
    let cancelled = false;
    let interval: number | null = null;

    const hasTimedOut = () => Date.now() >= deadlineMs;

    const timeoutToAction = () => {
      setState("error");
      setMessage("La activación está tardando más de 3 minutos. Puedes volver a intentar el pago.");
      if (interval) window.clearInterval(interval);
    };

    const check = async () => {
      if (hasTimedOut()) {
        if (!cancelled) timeoutToAction();
        return;
      }

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
      if (hasTimedOut()) {
        if (!cancelled) timeoutToAction();
        return;
      }
      setTicks((v) => v + 1);
      void check();
    }, 2500);

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [deadlineMs, retryKey, router]);

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-black tracking-tight text-zinc-950">Confirmando tu membresía</h1>
      <p className="mt-3 text-zinc-700">{message}</p>

      <div className="mt-5 rounded-2xl border border-black/10 bg-zinc-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <div className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold tabular-nums text-zinc-900">
            {formatTimer(remainingMs)}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Tiempo máximo estimado de activación: 3 minutos. Si se agota, podrás volver a intentar el pago.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link
          href={retryPaymentHref}
          className="rounded-xl bg-zinc-950 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Volver a intentar pago
        </Link>
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
