"use client";

import { useState, useTransition } from "react";

type Plan = {
  id: string;
  code: "monthly" | "annual";
  name: string;
  intervalLabel: string;
  priceCents: number;
  currency: string;
  discountPercent: number | null;
  discountLabel: string | null;
  discountEndsAt: string | Date | null;
  isActive: boolean;
};

function centsToEuroInput(cents: number) {
  return (cents / 100).toFixed(2);
}

function euroInputToCents(value: string) {
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

async function savePlan(payload: unknown) {
  const res = await fetch("/api/admin/subscription-plans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({ ok: false, message: `Error ${res.status}` }));
  if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo guardar");
  return json;
}

export function SubscriptionPlanDiscounts({ plans }: { plans: Plan[] }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });
  const [forms, setForms] = useState(() =>
    Object.fromEntries(
      plans.map((p) => [
        p.code,
        {
          priceEur: centsToEuroInput(p.priceCents),
          discountPercent: p.discountPercent ? String(p.discountPercent) : "",
          discountLabel: p.discountLabel || "",
          discountEndsAt: p.discountEndsAt ? new Date(p.discountEndsAt).toISOString().slice(0, 16) : "",
          isActive: p.isActive,
        },
      ]),
    ) as Record<string, { priceEur: string; discountPercent: string; discountLabel: string; discountEndsAt: string; isActive: boolean }>,
  );

  function setField(code: string, key: string, value: string | boolean) {
    setForms((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [key]: value,
      },
    }));
  }

  function submit(code: "monthly" | "annual") {
    startTransition(async () => {
      setStatus({ type: "idle", text: "" });
      const form = forms[code];
      try {
        await savePlan({
          code,
          priceCents: euroInputToCents(form.priceEur),
          discountPercent: form.discountPercent ? Number(form.discountPercent) : null,
          discountLabel: form.discountLabel || null,
          discountEndsAt: form.discountEndsAt ? new Date(form.discountEndsAt).toISOString() : null,
          isActive: form.isActive,
        });
        setStatus({ type: "ok", text: `Plan ${code} actualizado correctamente.` });
      } catch (error) {
        setStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar el plan." });
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {plans.map((plan) => {
        const form = forms[plan.code];
        return (
          <section key={plan.id} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-zinc-950">{plan.name}</h2>
                <p className="mt-1 text-sm text-zinc-600">Gestiona precio y descuento visible en la página de membresía.</p>
              </div>
              <span className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
                {plan.code}
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Precio base (EUR)
                <input
                  value={form?.priceEur || ""}
                  onChange={(e) => setField(plan.code, "priceEur", e.target.value)}
                  className="rounded-xl border border-black/10 px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Descuento (%)
                <input
                  type="number"
                  min={0}
                  max={95}
                  value={form?.discountPercent || ""}
                  onChange={(e) => setField(plan.code, "discountPercent", e.target.value)}
                  className="rounded-xl border border-black/10 px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Texto del descuento (opcional)
                <input
                  value={form?.discountLabel || ""}
                  onChange={(e) => setField(plan.code, "discountLabel", e.target.value)}
                  placeholder="Ej: Promo lanzamiento"
                  className="rounded-xl border border-black/10 px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-zinc-800">
                Fecha fin descuento
                <input
                  type="datetime-local"
                  value={form?.discountEndsAt || ""}
                  onChange={(e) => setField(plan.code, "discountEndsAt", e.target.value)}
                  className="rounded-xl border border-black/10 px-3 py-2"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800">
                <input
                  type="checkbox"
                  checked={Boolean(form?.isActive)}
                  onChange={(e) => setField(plan.code, "isActive", e.target.checked)}
                />
                Plan activo
              </label>
            </div>

            <div className="mt-6">
              <button
                type="button"
                disabled={pending}
                onClick={() => submit(plan.code)}
                className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </section>
        );
      })}

      {status.text ? (
        <p className={`lg:col-span-2 text-sm ${status.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
          {status.text}
        </p>
      ) : null}
    </div>
  );
}

