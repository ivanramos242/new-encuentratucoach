import { MembershipCoachLanding } from "@/components/marketing/membership-coach-landing";
import { JsonLd } from "@/components/seo/json-ld";
import { getOptionalSessionUser } from "@/lib/auth-server";
import { listMembershipPlansForPublic } from "@/lib/membership-plan-service";
import { prisma } from "@/lib/prisma";
import { listPublicCoachesMerged } from "@/lib/public-coaches";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";
import { formatEuro } from "@/lib/utils";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

const PENDING_ACTIVATION_WINDOW_MS = 3 * 60 * 1000;
const MEMBERSHIP_KEYWORDS = [
  "plataformas para trabajar como coach",
  "plataforma para coaches",
  "captar clientes como coach",
  "membresía para coaches",
  "plataforma coaching online",
];

function pick(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
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
        select: { id: true, status: true, planCode: true, updatedAt: true },
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
    return { primaryHref: "/registro?intent=coach", primaryLabel: "Crear cuenta de coach" };
  }

  if (options?.coachHasPendingActivation) {
    return { primaryHref: "/membresia/confirmacion", primaryLabel: "Procesando activación" };
  }

  if (sessionUser.role === "client") {
    return { primaryHref: `/membresia/checkout?plan=${planCode}`, primaryLabel: "Pagar membresía" };
  }

  if (sessionUser.role === "coach" || sessionUser.role === "admin") {
    if (options?.coachHasActivePlan) {
      if (options.coachActivePlanCode === planCode) {
        return { primaryHref: "/mi-cuenta/coach/membresia", primaryLabel: "Mi plan actual" };
      }
      return {
        primaryHref: "/mi-cuenta/coach/membresia#cambiar-plan",
        primaryLabel: planCode === "monthly" ? "Cambiar a plan mensual" : "Cambiar a plan anual",
      };
    }
    return { primaryHref: `/mi-cuenta/coach/membresia?plan=${planCode}`, primaryLabel: "Pagar membresía" };
  }

  return { primaryHref: "/registro?intent=coach", primaryLabel: "Crear cuenta de coach" };
}

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Membresía para coaches",
  description:
    "Activa tu perfil profesional y capta clientes con una plataforma especializada en coaches, reseñas y visibilidad SEO.",
  path: "/membresia",
  keywords: MEMBERSHIP_KEYWORDS,
});

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
  const coachHasPendingActivation = isRecentPendingCoachActivation(
    latestSubscription?.status,
    latestSubscription?.updatedAt,
  );
  const coachActivePlanCode =
    coachHasActivePlan && isPlanCode(latestSubscription?.planCode) ? latestSubscription.planCode : null;

  const plans = await listMembershipPlansForPublic();
  const publicCoaches = await listPublicCoachesMerged();
  const monthlyPlan = plans.find((plan) => plan.code === "monthly") ?? plans[0];
  const annualPlan = plans.find((plan) => plan.code === "annual");
  const monthlyPrice = monthlyPlan ? formatEuro(monthlyPlan.checkoutDisplayPriceCents / 100) : "19,99 EUR";
  const annualPrice = annualPlan
    ? formatEuro(annualPlan.checkoutDisplayPriceCents / 100)
    : monthlyPlan
      ? formatEuro((monthlyPlan.checkoutDisplayPriceCents * 12) / 100)
      : "220 EUR";

  const monthlyPlanAction = getPlanAction(sessionUser, "monthly", {
    coachHasActivePlan,
    coachActivePlanCode,
    coachHasPendingActivation,
  });

  const plansForLanding = [...plans].sort((a, b) => {
    if (a.code === b.code) return 0;
    if (a.code === "monthly") return -1;
    if (b.code === "monthly") return 1;
    return 0;
  });

  const landingPlans = plansForLanding.map((plan) => {
    const action = getPlanAction(sessionUser, plan.code, {
      coachHasActivePlan,
      coachActivePlanCode,
      coachHasPendingActivation,
    });

    const hasDiscount = plan.discountActive && plan.checkoutDisplayPriceCents < plan.priceCents;
    return {
      code: plan.code,
      name: plan.name,
      intervalLabel: plan.intervalLabel,
      price: formatEuro(plan.checkoutDisplayPriceCents / 100),
      originalPrice: hasDiscount ? formatEuro(plan.priceCents / 100) : null,
      discountLabel: hasDiscount
        ? `${plan.discountPercent ?? 0}%${plan.discountLabel ? ` · ${plan.discountLabel}` : ""}`
        : null,
      ctaHref: action.primaryHref,
      ctaLabel: action.primaryLabel,
    };
  });

  const exampleCoach = publicCoaches.find((coach) => coach.slug === "carla-gomez-rodriguez") ?? publicCoaches[0] ?? null;
  const proof = {
    certifiedCount: publicCoaches.filter((coach) => coach.certifiedStatus === "approved").length,
    publishedCount: publicCoaches.length,
    totalReviews: publicCoaches.reduce((sum, coach) => sum + coach.reviews.length, 0),
    exampleClicks: exampleCoach ? Object.values(exampleCoach.metrics.clicks).reduce((sum, value) => sum + value, 0) : 0,
    exampleViews: exampleCoach?.metrics.totalViews ?? 0,
    searchExamples: [
      "coach en Madrid",
      "coach online",
      "coaching de carrera",
      "coach de liderazgo en Barcelona",
    ],
  };

  const baseUrl = getSiteBaseUrl();
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Membresía", path: "/membresia" },
  ]);
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Membresía para coaches",
    url: `${baseUrl}/membresia`,
    description:
      "Activa tu perfil profesional y capta clientes con una plataforma especializada en coaches, reseñas y visibilidad SEO.",
    keywords: MEMBERSHIP_KEYWORDS.join(", "),
  };

  return (
    <>
      <JsonLd data={[breadcrumb, webPageSchema]} />

      {checkout === "cancel" ? (
        <section className="mx-auto mt-6 w-full max-w-6xl rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">
            Pago cancelado. No se ha activado ninguna membresía. Puedes volver a intentarlo cuando quieras.
          </p>
        </section>
      ) : null}

      {coachHasPendingActivation ? (
        <section className="mx-auto mt-6 w-full max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
          <p className="text-sm font-semibold text-amber-900">
            Estamos procesando tu activación en Stripe. Te activaremos automáticamente en cuanto se confirme el pago.
          </p>
        </section>
      ) : null}

      <MembershipCoachLanding
        annualPrice={annualPrice}
        exampleCoach={exampleCoach}
        joinHref={monthlyPlanAction.primaryHref}
        joinLabel={monthlyPlanAction.primaryLabel}
        monthlyPrice={monthlyPrice}
        plans={landingPlans}
        proof={proof}
      />
    </>
  );
}
