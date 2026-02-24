"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

async function createCheckout(planCode: "monthly" | "annual") {
  const res = await fetch("/api/stripe/checkout-session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ planCode }),
  });
  const json = await res.json().catch(() => ({ ok: false, message: `Error ${res.status}` }));
  if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo iniciar el pago");
  return json as { checkoutUrl?: string };
}

export function MembershipCheckoutCard({
  currentStatus,
  profileHref = "/mi-cuenta/coach/perfil",
  showOnboardingCta = false,
  onboardingStepSummary,
}: {
  currentStatus?: { status?: string | null; planCode?: string | null; currentPeriodEnd?: string | null } | null;
  profileHref?: string;
  showOnboardingCta?: boolean;
  onboardingStepSummary?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "error"; text: string }>({ type: "idle", text: "" });
  const hasActiveSubscription = currentStatus?.status === "active" || currentStatus?.status === "trialing";

  function startCheckout(planCode: "monthly" | "annual") {
    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        const json = await createCheckout(planCode);
        if (json.checkoutUrl) {
          window.location.href = json.checkoutUrl;
          return;
        }
        setStatus({ type: "error", text: "Stripe no devolvió URL de checkout." });
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo iniciar el pago." });
      }
    });
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black tracking-tight text-zinc-950">Membresía de coach</h2>
      <p className="mt-2 text-sm text-zinc-700">
        Activa tu suscripción con Stripe para publicar el perfil y responder en mensajería/Q&A.
      </p>

      <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-800">
        <p>
          Estado actual: <strong>{currentStatus?.status || "sin suscripción"}</strong>
          {currentStatus?.planCode ? ` · plan ${currentStatus.planCode}` : ""}
        </p>
        {currentStatus?.currentPeriodEnd ? (
          <p className="mt-1 text-xs text-zinc-600">
            Periodo actual hasta: {new Date(currentStatus.currentPeriodEnd).toLocaleString("es-ES")}
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {hasActiveSubscription ? (
          <>
            <Link
              href={showOnboardingCta ? `${profileHref}${profileHref.includes("?") ? "&" : "?"}wizard=1` : profileHref}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white"
            >
              {showOnboardingCta ? "Empezar wizard de perfil" : "Editar mi perfil coach"}
            </Link>
            <Link
              href="/coaches"
              className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900"
            >
              Ver directorio
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => startCheckout("monthly")}
              className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Procesando..." : "Activar plan mensual"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => startCheckout("annual")}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 disabled:opacity-60"
            >
              {pending ? "Procesando..." : "Activar plan anual"}
            </button>
          </>
        )}
      </div>

      {hasActiveSubscription && showOnboardingCta ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Pago confirmado. Siguiente paso: completar tu perfil coach.</p>
          {onboardingStepSummary ? <p className="mt-1">{onboardingStepSummary}</p> : null}
        </div>
      ) : null}

      {status.text ? <p className="mt-4 text-sm text-red-600">{status.text}</p> : null}
    </div>
  );
}
