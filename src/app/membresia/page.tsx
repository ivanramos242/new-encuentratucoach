import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { getOptionalSessionUser } from "@/lib/auth-server";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";
import { listMembershipPlansForPublic } from "@/lib/membership-plan-service";
import { buildMetadata } from "@/lib/seo";
import { formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Membresía para coaches",
  description: "Planes mensual y anual para coaches que quieren tener un perfil activo en el directorio.",
  path: "/membresia",
});

function planFeatures(code: "monthly" | "annual") {
  if (code === "annual") {
    return [
      "Todo lo del plan mensual",
      "Ahorro anual",
      "Prioridad en mejoras",
      "Preparado para futuras funciones premium",
    ];
  }
  return ["Perfil público activo", "SEO en directorio", "Reseñas y certificación", "Métricas básicas V1"];
}

function isActiveCoachSubscription(status?: string | null) {
  return status === "active" || status === "trialing";
}

function getPlanAction(
  sessionUser: Awaited<ReturnType<typeof getOptionalSessionUser>>,
  planCode: "monthly" | "annual",
  options?: { coachHasActivePlan?: boolean },
) {
  if (!sessionUser) {
    return {
      primaryHref: "/registro/coach",
      primaryLabel: "Crear cuenta de coach",
      secondaryHref: "/iniciar-sesion",
      secondaryLabel: "Ya tengo cuenta",
    };
  }

  if (sessionUser.role === "coach" || sessionUser.role === "admin") {
    if (options?.coachHasActivePlan) {
      return {
        primaryHref: "/mi-cuenta/coach/membresia",
        primaryLabel: "Mi plan actual",
        secondaryHref: undefined,
        secondaryLabel: undefined,
      };
    }

    return {
      primaryHref: `/mi-cuenta/coach/membresia?plan=${planCode}`,
      primaryLabel: "Pagar membresía",
      secondaryHref: "/mi-cuenta/coach/perfil",
      secondaryLabel: "Editar mi perfil",
    };
  }

  return {
    primaryHref: "/registro/coach",
    primaryLabel: "Crear cuenta de coach",
    secondaryHref: "/mi-cuenta/cliente",
    secondaryLabel: "Ir a mi cuenta",
  };
}

export default async function MembershipPage() {
  const sessionUser = await getOptionalSessionUser();
  const coachProfile =
    sessionUser && (sessionUser.role === "coach" || sessionUser.role === "admin")
      ? await getCoachProfileForEditor(sessionUser)
      : null;
  const coachHasActivePlan = isActiveCoachSubscription(coachProfile?.subscriptions?.[0]?.status);
  const plans = await listMembershipPlansForPublic();

  return (
    <>
      <PageHero
        badge="Stripe Billing · mensual y anual"
        title="Membresía para coaches"
        description="Solo los coaches pagan para tener su perfil activo en la plataforma. Sin comisiones por contacto."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => {
            const cta = getPlanAction(sessionUser, plan.code, { coachHasActivePlan });
            const highlighted = plan.code === "annual";
            const hasDiscount = plan.discountActive && plan.effectivePriceCents < plan.priceCents;
            const original = formatEuro(plan.priceCents / 100);
            const current = formatEuro(plan.effectivePriceCents / 100);
            return (
              <section
                key={plan.id}
                className={
                  highlighted
                    ? "rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-sm"
                    : "rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-zinc-950">{plan.name}</h2>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-3xl font-black tracking-tight text-zinc-950">
                        {current}/{plan.intervalLabel}
                      </p>
                      {hasDiscount ? (
                        <p className="text-sm font-semibold text-zinc-500 line-through">{original}/{plan.intervalLabel}</p>
                      ) : null}
                    </div>
                  </div>
                  {hasDiscount ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right">
                      <p className="text-sm font-black text-emerald-800">
                        -{plan.discountPercent}% {plan.discountLabel ? `· ${plan.discountLabel}` : ""}
                      </p>
                      {plan.discountEndsAt ? (
                        <p className="mt-1 text-xs text-emerald-700">
                          Hasta {new Date(plan.discountEndsAt).toLocaleString("es-ES")}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <p className="mt-3 text-zinc-700">
                  {plan.code === "monthly"
                    ? "Ideal para validar la plataforma y empezar a recibir visibilidad."
                    : "Mejor coste anual para coaches que quieren continuidad y posicionamiento."}
                </p>
                <ul className="mt-5 grid gap-2 text-sm text-zinc-700">
                  {planFeatures(plan.code).map((feature) => (
                    <li key={feature} className="rounded-xl border border-black/10 bg-white/80 px-3 py-2">
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={cta.primaryHref}
                    className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    {cta.primaryLabel}
                  </Link>
                  {cta.secondaryHref && cta.secondaryLabel ? (
                    <Link
                      href={cta.secondaryHref}
                      className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                    >
                      {cta.secondaryLabel}
                    </Link>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </PageShell>
    </>
  );
}
