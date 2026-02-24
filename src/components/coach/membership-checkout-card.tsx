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

async function postAction(url: string) {
  const res = await fetch(url, { method: "POST" });
  const json = await res.json().catch(() => ({ ok: false, message: `Error ${res.status}` }));
  if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo completar la accion");
  return json;
}

export function MembershipCheckoutCard({
  currentStatus,
  profileHref = "/mi-cuenta/coach/perfil",
  showOnboardingCta = false,
  onboardingStepSummary,
}: {
  currentStatus?: {
    status?: string | null;
    planCode?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean | null;
  } | null;
  profileHref?: string;
  showOnboardingCta?: boolean;
  onboardingStepSummary?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "error"; text: string }>({ type: "idle", text: "" });
  const hasActiveSubscription = currentStatus?.status === "active" || currentStatus?.status === "trialing";
  const cancelAtPeriodEnd = Boolean(currentStatus?.cancelAtPeriodEnd);

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

  function openBillingPortal() {
    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        const json = (await postAction("/api/stripe/billing-portal")) as { url?: string };
        if (json.url) {
          window.location.href = json.url;
          return;
        }
        setStatus({ type: "error", text: "Stripe no devolvio URL del portal." });
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo abrir el portal." });
      }
    });
  }

  function setCancellation(cancel: boolean) {
    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        await postAction(cancel ? "/api/stripe/subscription/cancel" : "/api/stripe/subscription/resume");
        window.location.reload();
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar la suscripcion." });
      }
    });
  }

  function cancelNow() {
    const ok = window.confirm(
      "Vas a cancelar la membresia inmediatamente. Tu perfil dejara de estar activo en el directorio. ¿Continuar?",
    );
    if (!ok) return;
    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        await postAction("/api/stripe/subscription/cancel-now");
        window.location.reload();
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo cancelar la suscripcion." });
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
        {hasActiveSubscription && cancelAtPeriodEnd ? (
          <p className="mt-1 text-xs font-semibold text-amber-700">La suscripcion se cancelara al final del periodo actual.</p>
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

      {hasActiveSubscription ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={pending}
            onClick={openBillingPortal}
            className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 disabled:opacity-60"
          >
            Gestionar facturacion (Stripe)
          </button>
          {cancelAtPeriodEnd ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setCancellation(false)}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 disabled:opacity-60"
            >
              Reactivar renovacion
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setCancellation(true)}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
            >
              Cancelar al final del periodo
            </button>
          )}
          {!cancelAtPeriodEnd ? (
            <button
              type="button"
              disabled={pending}
              onClick={cancelNow}
              className="sm:col-span-2 rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
            >
              Cancelar ahora (inmediato)
            </button>
          ) : null}
        </div>
      ) : null}

      {status.text ? <p className="mt-4 text-sm text-red-600">{status.text}</p> : null}
    </div>
  );
}
