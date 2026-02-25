"use client";

import { faListCheck, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

type PlanCode = "monthly" | "annual";

async function createCheckout(
  planCode: PlanCode,
  options?: {
    successPath?: string;
    cancelPath?: string;
  },
) {
  const res = await fetch("/api/stripe/checkout-session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      planCode,
      successPath: options?.successPath,
      cancelPath: options?.cancelPath,
    }),
  });
  const json = await res.json().catch(() => ({ ok: false, message: `Error ${res.status}` }));
  if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo iniciar el pago");
  return json as { checkoutUrl?: string };
}

function withPlanParam(path: string | undefined, planCode: PlanCode) {
  if (!path) return undefined;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}plan=${planCode}`;
}

async function postAction(url: string) {
  const res = await fetch(url, { method: "POST" });
  const json = await res.json().catch(() => ({ ok: false, message: `Error ${res.status}` }));
  if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo completar la acción");
  return json;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function MembershipCheckoutCard({
  currentStatus,
  profileHref = "/mi-cuenta/coach/perfil",
  checkoutPaths,
  pendingActivation,
  checkoutStatus,
  showOnboardingCta = false,
  onboardingStepSummary,
}: {
  currentStatus?: {
    status?: string | null;
    planCode?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean | null;
    updatedAt?: string | null;
  } | null;
  profileHref?: string;
  checkoutPaths?: {
    successPath?: string;
    cancelPath?: string;
  };
  pendingActivation?: {
    active: boolean;
    pendingUntilEpochMs: number;
    retryCheckoutHref: string;
    planCode: PlanCode;
  } | null;
  checkoutStatus?: string | null;
  showOnboardingCta?: boolean;
  onboardingStepSummary?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "error"; text: string }>({ type: "idle", text: "" });
  const [remainingMs, setRemainingMs] = useState(0);

  const hasActiveSubscription = currentStatus?.status === "active" || currentStatus?.status === "trialing";
  const cancelAtPeriodEnd = Boolean(currentStatus?.cancelAtPeriodEnd);
  const pendingActivationActive = Boolean(pendingActivation?.active);
  const pendingActivationTimedOut = pendingActivationActive && remainingMs <= 0;
  const pendingRetryCheckoutHref = pendingActivation?.retryCheckoutHref || "/membresia";

  const inactiveStatusHint = useMemo(() => {
    const s = currentStatus?.status || null;
    if (s === "past_due" || s === "unpaid") {
      return "Tu suscripción anterior no pudo renovarse. Puedes volver a pagar para reactivar la membresía.";
    }
    if (s === "canceled" || s === "incomplete_expired") {
      return "Tu membresía está cancelada. Puedes activar un nuevo pago cuando quieras.";
    }
    return null;
  }, [currentStatus?.status]);

  useEffect(() => {
    if (!pendingActivation?.active) return;

    const update = () => setRemainingMs(Math.max(0, pendingActivation.pendingUntilEpochMs - Date.now()));
    const firstTick = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, [pendingActivation?.active, pendingActivation?.pendingUntilEpochMs]);

  function startCheckout(planCode: PlanCode) {
    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        const json = await createCheckout(planCode, {
          successPath: withPlanParam(checkoutPaths?.successPath, planCode),
          cancelPath: withPlanParam(checkoutPaths?.cancelPath, planCode),
        });
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
        setStatus({ type: "error", text: "Stripe no devolvió URL del portal." });
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
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo actualizar la suscripción." });
      }
    });
  }

  function cancelNow() {
    const ok = window.confirm(
      "Vas a cancelar la membresía inmediatamente. Tu perfil dejará de estar activo en el directorio. ¿Continuar?",
    );
    if (!ok) return;
    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        await postAction("/api/stripe/subscription/cancel-now");
        window.location.reload();
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo cancelar la suscripción." });
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
            Período actual hasta: {new Date(currentStatus.currentPeriodEnd).toLocaleString("es-ES")}
          </p>
        ) : null}
        {hasActiveSubscription && cancelAtPeriodEnd ? (
          <p className="mt-1 text-xs font-semibold text-amber-700">
            La suscripción se cancelará al final del período actual.
          </p>
        ) : null}
        {!hasActiveSubscription && inactiveStatusHint ? <p className="mt-1 text-xs text-zinc-700">{inactiveStatusHint}</p> : null}
      </div>

      {checkoutStatus === "cancel" ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
          Pago cancelado. No se ha activado ninguna membresía. Puedes volver a intentarlo cuando quieras.
        </div>
      ) : null}

      {pendingActivationActive ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-amber-900">Procesando activación de la membresía</p>
              <p className="mt-1 text-xs text-amber-800">
                {pendingActivationTimedOut
                  ? "Han pasado 3 minutos sin confirmación. Puedes volver a intentar el pago."
                  : "Stripe está procesando el pago. En cuanto termine, actualiza el estado."}
              </p>
            </div>
            <div className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-sm font-semibold tabular-nums text-amber-900">
              {formatCountdown(remainingMs)}
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Link
              href={pendingRetryCheckoutHref}
              className="rounded-xl bg-zinc-950 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Volver a intentar pago
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Actualizar estado
            </button>
            <Link
              href={showOnboardingCta ? profileHref : "/mi-cuenta/coach"}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Ir a mi cuenta
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {hasActiveSubscription ? (
          <>
            <Link
              href={showOnboardingCta ? `${profileHref}${profileHref.includes("?") ? "&" : "?"}wizard=1` : profileHref}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white"
            >
              <FontAwesomeIcon
                icon={showOnboardingCta ? faListCheck : faPen}
                className="mr-2 h-3.5 w-3.5"
              />
              {showOnboardingCta ? "Empezar formulario de bienvenida" : "Editar mi perfil coach"}
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
              disabled={pending || pendingActivationActive}
              onClick={() => startCheckout("monthly")}
              className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Procesando..." : currentStatus?.status ? "Reactivar plan mensual" : "Activar plan mensual"}
            </button>
            <button
              type="button"
              disabled={pending || pendingActivationActive}
              onClick={() => startCheckout("annual")}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 disabled:opacity-60"
            >
              {pending ? "Procesando..." : currentStatus?.status ? "Reactivar plan anual" : "Activar plan anual"}
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
            Gestionar facturación (Stripe)
          </button>
          {cancelAtPeriodEnd ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setCancellation(false)}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 disabled:opacity-60"
            >
              Reactivar renovación
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setCancellation(true)}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
            >
              Cancelar al final del período
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
