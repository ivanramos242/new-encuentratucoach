"use client";

import { faChevronDown, faListCheck, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

type PlanCode = "monthly" | "annual";

function isPlanCode(value?: string | null): value is PlanCode {
  return value === "monthly" || value === "annual";
}

async function createCheckout(
  planCode: PlanCode,
  options?: {
    successPath?: string;
    cancelPath?: string;
    forceRestart?: boolean;
  },
) {
  const idempotencyKey = options?.forceRestart ? `force-retry:${planCode}:${Date.now()}` : undefined;
  const res = await fetch("/api/stripe/checkout-session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      planCode,
      successPath: options?.successPath,
      cancelPath: options?.cancelPath,
      forceRestart: options?.forceRestart ?? false,
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
  if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo completar la accion");
  return json;
}

async function postJsonAction(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ ok: false, message: `Error ${res.status}` }));
  if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo completar la accion");
  return json;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getPlanLabel(planCode?: string | null) {
  if (planCode === "monthly") return "mensual";
  if (planCode === "annual") return "anual";
  return "-";
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
  const [status, setStatus] = useState<{ type: "idle" | "error" | "success"; text: string }>({ type: "idle", text: "" });
  const [remainingMs, setRemainingMs] = useState(0);

  const hasActiveSubscription = currentStatus?.status === "active" || currentStatus?.status === "trialing";
  const activePlanCode = isPlanCode(currentStatus?.planCode) ? currentStatus.planCode : null;
  const cancelAtPeriodEnd = Boolean(currentStatus?.cancelAtPeriodEnd);
  const pendingActivationActive = Boolean(pendingActivation?.active);
  const pendingActivationTimedOut = pendingActivationActive && remainingMs <= 0;
  const pendingRetryCheckoutHref = pendingActivation?.retryCheckoutHref || "/membresia";

  const inactiveStatusHint = useMemo(() => {
    const s = currentStatus?.status || null;
    if (s === "past_due" || s === "unpaid") {
      return "Tu suscripcion anterior no pudo renovarse. Puedes volver a pagar para reactivar la membresia.";
    }
    if (s === "canceled" || s === "incomplete_expired") {
      return "Tu membresia esta cancelada. Puedes activar un nuevo pago cuando quieras.";
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

  function startCheckout(planCode: PlanCode, options?: { forceRestart?: boolean }) {
    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        const json = await createCheckout(planCode, {
          successPath: withPlanParam(checkoutPaths?.successPath, planCode),
          cancelPath: withPlanParam(checkoutPaths?.cancelPath, planCode),
          forceRestart: options?.forceRestart ?? false,
        });
        if (json.checkoutUrl) {
          window.location.href = json.checkoutUrl;
          return;
        }
        setStatus({ type: "error", text: "Stripe no devolvio URL de checkout." });
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

  function changePlan(planCode: PlanCode) {
    if (!hasActiveSubscription || activePlanCode === planCode) return;
    const targetPlanLabel = planCode === "monthly" ? "plan mensual" : "plan anual";
    const currentPlanLabel =
      activePlanCode === "monthly" ? "plan mensual" : activePlanCode === "annual" ? "plan anual" : "tu plan actual";
    const ok = window.confirm(
      `Vas a cambiar de ${currentPlanLabel} a ${targetPlanLabel}. Se cobrara el nuevo plan a la tarjeta asignada en Stripe. Quieres continuar?`,
    );
    if (!ok) return;

    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      try {
        await postJsonAction("/api/stripe/subscription/change-plan", { planCode });
        setStatus({ type: "success", text: "Plan actualizado. Recargando..." });
        window.location.reload();
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo cambiar el plan." });
      }
    });
  }

  function cancelNow() {
    const ok = window.confirm(
      "Vas a cancelar la membresia inmediatamente. Tu perfil dejara de estar activo en el directorio. Continuar?",
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
    <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm max-[390px]:p-3.5 sm:p-6">
      <h2 className="text-xl font-extrabold tracking-tight text-zinc-950 max-[390px]:text-lg">Membresia de coach</h2>
      <p className="mt-2 text-sm font-medium text-zinc-700 max-[390px]:text-xs">Empieza por el estado y ejecuta solo la accion que toca.</p>

      <div className="mt-4 grid gap-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-800 max-[390px]:gap-2 max-[390px]:p-3 sm:grid-cols-3">
        <InfoPill label="Estado" value={currentStatus?.status || "sin suscripcion"} />
        <InfoPill label="Plan" value={getPlanLabel(currentStatus?.planCode)} />
        <InfoPill
          label="Renovacion"
          value={cancelAtPeriodEnd ? "cancelada al final" : hasActiveSubscription ? "activa" : "-"}
        />
      </div>

      {currentStatus?.currentPeriodEnd ? (
        <p className="mt-2 text-xs text-zinc-600 max-[390px]:text-[11px]">
          Periodo actual hasta: {new Date(currentStatus.currentPeriodEnd).toLocaleString("es-ES")}
        </p>
      ) : null}

      {!hasActiveSubscription && inactiveStatusHint ? <p className="mt-2 text-xs text-zinc-700 max-[390px]:text-[11px]">{inactiveStatusHint}</p> : null}

      {checkoutStatus === "cancel" ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
          Pago cancelado. No se activo ningun plan. Puedes intentarlo de nuevo cuando quieras.
        </div>
      ) : null}

      {pendingActivationActive ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-amber-900">Procesando activacion de membresia</p>
              <p className="mt-1 text-xs text-amber-800">
                {pendingActivationTimedOut
                  ? "Han pasado 3 minutos sin confirmacion. Puedes reintentar el pago."
                  : "Stripe esta procesando el pago. Actualiza en unos segundos."}
              </p>
            </div>
            <div className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-sm font-semibold tabular-nums text-amber-900">
              {formatCountdown(remainingMs)}
            </div>
          </div>
          <div className="mt-3 grid gap-2 max-[390px]:grid-cols-1 sm:grid-cols-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => startCheckout(pendingActivation?.planCode || "monthly", { forceRestart: true })}
              className="rounded-xl bg-zinc-950 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              Reintentar pago ahora
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Actualizar estado
            </button>
            <Link
              href={pendingRetryCheckoutHref}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Abrir checkout
            </Link>
          </div>
        </div>
      ) : null}

      {!hasActiveSubscription ? (
        <section className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-800">Activa tu plan</h3>
          <div className="mt-3 grid gap-3 max-[390px]:gap-2 sm:grid-cols-2">
            <PlanCard
              title="Plan mensual"
              helper="Flexibilidad mes a mes"
              cta={pending ? "Procesando..." : currentStatus?.status ? "Reactivar mensual" : "Activar mensual"}
              disabled={pending || pendingActivationActive}
              onClick={() => startCheckout("monthly")}
            />
            <PlanCard
              title="Plan anual"
              helper="Menos gestion durante el ano"
              cta={pending ? "Procesando..." : currentStatus?.status ? "Reactivar anual" : "Activar anual"}
              disabled={pending || pendingActivationActive}
              onClick={() => startCheckout("annual")}
              highlighted
            />
          </div>
        </section>
      ) : (
        <section className="mt-5 grid gap-3 max-[390px]:gap-2 sm:grid-cols-2">
          <Link
            href={showOnboardingCta ? `${profileHref}${profileHref.includes("?") ? "&" : "?"}wizard=1` : profileHref}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white"
          >
            <FontAwesomeIcon icon={showOnboardingCta ? faListCheck : faPen} className="mr-2 h-3.5 w-3.5" />
            {showOnboardingCta ? "Completar formulario" : "Editar perfil coach"}
          </Link>
          <button
            type="button"
            disabled={pending}
            onClick={openBillingPortal}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 disabled:opacity-60 sm:w-auto"
          >
            Gestionar facturacion (Stripe)
          </button>
        </section>
      )}

      {hasActiveSubscription && showOnboardingCta ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 max-[390px]:p-3 max-[390px]:text-xs">
          <p className="font-semibold">Pago confirmado. Siguiente paso: completar tu perfil coach.</p>
          {onboardingStepSummary ? <p className="mt-1">{onboardingStepSummary}</p> : null}
        </div>
      ) : null}

      {hasActiveSubscription ? (
        <section className="mt-5 space-y-3">
          <details className="group rounded-2xl border border-black/10 bg-white p-4 max-[390px]:p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-zinc-900">
              Gestion avanzada de renovacion y cancelacion
              <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5 text-zinc-500 transition group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-xs text-zinc-600">Estas acciones afectan la continuidad y visibilidad de tu perfil.</p>
            <div className="mt-3 grid gap-2 max-[390px]:grid-cols-1 sm:grid-cols-2">
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
                  className="rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
                >
                  Cancelar ahora (inmediato)
                </button>
              ) : null}
            </div>
          </details>

          {activePlanCode ? (
            <details className="group rounded-2xl border border-black/10 bg-white p-4 max-[390px]:p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-zinc-900">
                Cambiar plan
                <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5 text-zinc-500 transition group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-xs text-zinc-600">Solo puede existir un plan activo. El cambio se aplica al plan actual.</p>
              <div className="mt-3 grid gap-2 max-[390px]:grid-cols-1 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={pending || pendingActivationActive || activePlanCode === "monthly"}
                  onClick={() => changePlan("monthly")}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 disabled:opacity-60"
                >
                  {pending
                    ? "Procesando..."
                    : activePlanCode === "monthly"
                      ? "Plan mensual (actual)"
                      : "Cambiar a mensual"}
                </button>
                <button
                  type="button"
                  disabled={pending || pendingActivationActive || activePlanCode === "annual"}
                  onClick={() => changePlan("annual")}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 disabled:opacity-60"
                >
                  {pending
                    ? "Procesando..."
                    : activePlanCode === "annual"
                      ? "Plan anual (actual)"
                      : "Cambiar a anual"}
                </button>
              </div>
            </details>
          ) : null}
        </section>
      ) : null}

      {status.text ? (
        <p className={`mt-4 text-sm ${status.type === "success" ? "text-emerald-700" : "text-red-600"}`}>{status.text}</p>
      ) : null}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function PlanCard({
  title,
  helper,
  cta,
  disabled,
  onClick,
  highlighted,
}: {
  title: string;
  helper: string;
  cta: string;
  disabled: boolean;
  onClick: () => void;
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${highlighted ? "border-cyan-300 bg-cyan-50" : "border-black/10 bg-white"}`}>
      <p className="text-base font-bold text-zinc-950">{title}</p>
      <p className="mt-1 text-xs text-zinc-600">{helper}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${
          highlighted ? "bg-zinc-950 text-white" : "border border-black/10 bg-white text-zinc-900"
        }`}
      >
        {cta}
      </button>
    </div>
  );
}
