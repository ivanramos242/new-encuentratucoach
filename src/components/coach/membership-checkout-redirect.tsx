"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

type PlanCode = "monthly" | "annual";

export function MembershipCheckoutRedirect({ planCode }: { planCode: PlanCode }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  async function startCheckout() {
    startTransition(async () => {
      setError("");
      try {
        const res = await fetch("/api/stripe/checkout-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ planCode }),
        });
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; checkoutUrl?: string };
        if (!res.ok || !json.ok || !json.checkoutUrl) {
          throw new Error(json.message || "No se pudo iniciar el pago.");
        }
        window.location.href = json.checkoutUrl;
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo iniciar el pago.");
      }
    });
  }

  useEffect(() => {
    void startCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-black tracking-tight text-zinc-950">Preparando checkout</h1>
      <p className="mt-3 text-zinc-700">
        Estamos iniciando el pago de tu plan {planCode === "monthly" ? "mensual" : "anual"} con Stripe.
      </p>

      <div className="mt-6 rounded-2xl border border-black/10 bg-zinc-50 p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-3 w-3 animate-pulse rounded-full bg-cyan-500" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-700">
            {pending ? "Conectando con Stripe..." : error ? "No se pudo iniciar el checkout." : "Redirigiendo..."}
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={pending}
            className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            Reintentar pago
          </button>
          <Link
            href="/membresia"
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Volver a membresía
          </Link>
        </div>
      ) : null}
    </div>
  );
}
