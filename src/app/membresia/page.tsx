import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { getOptionalSessionUser } from "@/lib/auth-server";
import { listMembershipPlansForPublic } from "@/lib/membership-plan-service";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { formatEuro } from "@/lib/utils";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

const PENDING_ACTIVATION_WINDOW_MS = 3 * 60 * 1000;

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

function isPendingCoachActivation(status?: string | null) {
  return status === "incomplete";
}

function isPlanCode(value?: string | null): value is "monthly" | "annual" {
  return value === "monthly" || value === "annual";
}

function isRecentPendingCoachActivation(status?: string | null, updatedAt?: Date | null) {
  if (!isPendingCoachActivation(status) || !updatedAt) return false;
  const ageMs = Date.now() - updatedAt.getTime();
  return ageMs >= 0 && ageMs < PENDING_ACTIVATION_WINDOW_MS;
}

function pick(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

async function getMembershipCoachSubscriptionSummary(sessionUser: Awaited<ReturnType<typeof getOptionalSessionUser>>) {
  if (!sessionUser) return null;

  const whereOr = [
    ...(sessionUser.coachProfileId ? [{ id: sessionUser.coachProfileId }] : []),
    { userId: sessionUser.id },
  ];

  return prisma.coachProfile.findFirst({
    where: { OR: whereOr },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      subscriptions: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true, status: true, planCode: true, updatedAt: true, stripeSubscriptionId: true },
      },
    },
  });
}

function getPlanAction(
  sessionUser: Awaited<ReturnType<typeof getOptionalSessionUser>>,
  planCode: "monthly" | "annual",
  options?: {
    coachHasActivePlan?: boolean;
    coachActivePlanCode?: "monthly" | "annual" | null;
    coachHasPendingActivation?: boolean;
  },
) {
  if (!sessionUser) {
    return {
      primaryHref: "/registro?intent=coach",
      primaryLabel: "Crear cuenta de coach",
      secondaryHref: "/iniciar-sesion",
      secondaryLabel: "Ya tengo cuenta",
    };
  }

  if (options?.coachHasPendingActivation) {
    return {
      primaryHref: "/membresia/confirmacion",
      primaryLabel: "Procesando activación",
      secondaryHref: sessionUser.role === "client" ? "/mi-cuenta/cliente" : "/mi-cuenta/coach/membresia",
      secondaryLabel: "Ver estado",
    };
  }

  if (sessionUser.role === "client") {
    return {
      primaryHref: `/membresia/checkout?plan=${planCode}`,
      primaryLabel: "Pagar membresía",
      secondaryHref: "/mi-cuenta/cliente",
      secondaryLabel: "Ir a mi cuenta",
    };
  }

  if (sessionUser.role === "coach" || sessionUser.role === "admin") {
    if (options?.coachHasActivePlan) {
      if (options.coachActivePlanCode === planCode) {
        return {
          primaryHref: "/mi-cuenta/coach/membresia",
          primaryLabel: "Mi plan actual",
          secondaryHref: undefined,
          secondaryLabel: undefined,
        };
      }

      return {
        primaryHref: "/mi-cuenta/coach/membresia#cambiar-plan",
        primaryLabel: planCode === "monthly" ? "Cambiar a plan mensual" : "Cambiar a plan anual",
        secondaryHref: "/mi-cuenta/coach/membresia",
        secondaryLabel: "Ver mi membresia",
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
    primaryHref: "/registro?intent=coach",
    primaryLabel: "Crear cuenta de coach",
    secondaryHref: "/mi-cuenta/cliente",
    secondaryLabel: "Ir a mi cuenta",
  };
}

export default async function MembershipPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const checkout = pick(sp.checkout);
  const sessionUser = await getOptionalSessionUser();
  const membershipCoachProfile = await getMembershipCoachSubscriptionSummary(sessionUser);
  let latestSubscription = membershipCoachProfile?.subscriptions?.[0] ?? null;

  if (
    checkout === "cancel" &&
    latestSubscription &&
    latestSubscription.status === "incomplete" &&
    isRecentPendingCoachActivation(latestSubscription.status, latestSubscription.updatedAt)
  ) {
    await prisma.coachSubscription
      .update({
        where: { id: latestSubscription.id },
        data: { status: "canceled" },
      })
      .catch(() => undefined);
    latestSubscription = { ...latestSubscription, status: "canceled" };
  }

  const coachHasActivePlan = isActiveCoachSubscription(latestSubscription?.status);
  const coachHasPendingActivation = isRecentPendingCoachActivation(latestSubscription?.status, latestSubscription?.updatedAt);
  const coachActivePlanCode = coachHasActivePlan && isPlanCode(latestSubscription?.planCode) ? latestSubscription.planCode : null;
  const plans = await listMembershipPlansForPublic();

  return (
    <>
      <PageHero
        badge="Stripe Billing · mensual y anual"
        title="Membresía para coaches"
        description="Solo los coaches pagan para tener su perfil activo en la plataforma. Sin comisiones por contacto."
      />
      <PageShell className="pt-8">
        {checkout === "cancel" ? (
          <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">
              Pago cancelado. No se ha activado ninguna membresía. Puedes volver a intentarlo cuando quieras.
            </p>
          </div>
        ) : null}

        {coachHasPendingActivation ? (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-black tracking-wide text-amber-800">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500" aria-hidden="true" />
                  Procesando activación
                </p>
                <h2 className="mt-2 text-lg font-black tracking-tight text-zinc-950">
                  Estamos confirmando tu pago y activando tu cuenta coach
                </h2>
                <p className="mt-1 text-sm text-zinc-700">
                  Stripe está terminando de procesar la suscripción. En cuanto llegue la confirmación, te activaremos
                  automáticamente como coach.
                </p>
              </div>
              <Link
                href="/membresia/confirmacion"
                className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Ver estado de activación
              </Link>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => {
            const cta = getPlanAction(sessionUser, plan.code, {
              coachHasActivePlan,
              coachActivePlanCode,
              coachHasPendingActivation,
            });
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
                    className={
                      coachHasPendingActivation
                        ? "rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
                        : "rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                    }
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
