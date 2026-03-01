import { MembershipCoachLanding } from "@/components/marketing/membership-coach-landing";
import { JsonLd } from "@/components/seo/json-ld";
import { getOptionalSessionUser } from "@/lib/auth-server";
import { listMembershipPlansForPublic } from "@/lib/membership-plan-service";
import { prisma } from "@/lib/prisma";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";
import { formatEuro } from "@/lib/utils";
import "./membership-landing.css";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

const PENDING_ACTIVATION_WINDOW_MS = 3 * 60 * 1000;

const MEMBERSHIP_KEYWORDS = [
  "plataformas para trabajar como coach",
  "plataformas especializadas",
  "plataforma coaching online",
  "trabajar como coach online",
  "plataforma de coaching en linea",
  "plataforma de coaching",
  "trabajar como coach",
];

const FAQ_ITEMS = [
  {
    q: "Si trabajo con EncuentraTuCoach, mis clientes siguen siendo mios?",
    a: "Si. La plataforma te da visibilidad y herramientas, pero tu gestionas tu relacion profesional.",
  },
  {
    q: "Puedo seguir desarrollando mi marca propia?",
    a: "Si. Puedes usar el directorio como canal adicional mientras construyes tu marca.",
  },
  {
    q: "Cobrais comision por los clientes?",
    a: "No. El modelo es de membresia fija, sin comision por contacto.",
  },
  {
    q: "Que hago si no tengo resenas todavia?",
    a: "Empieza con 3 a 5 testimonios reales y pide resena al finalizar cada proceso.",
  },
] as const;

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Plataformas para trabajar como coach | Membresia",
  description:
    "Plataforma coaching online para trabajar como coach con SEO, resenas y contacto directo. Membresia para coaches en una plataforma de coaching en linea.",
  path: "/membresia",
  keywords: MEMBERSHIP_KEYWORDS as string[],
});

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
    return { primaryHref: "/membresia/confirmacion", primaryLabel: "Procesando activacion" };
  }

  if (sessionUser.role === "client") {
    return { primaryHref: `/membresia/checkout?plan=${planCode}`, primaryLabel: "Pagar membresia" };
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
    return { primaryHref: `/mi-cuenta/coach/membresia?plan=${planCode}`, primaryLabel: "Pagar membresia" };
  }

  return { primaryHref: "/registro?intent=coach", primaryLabel: "Crear cuenta de coach" };
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

  const monthlyPlan = plans.find((plan) => plan.code === "monthly") ?? plans[0];
  const annualPlan = plans.find((plan) => plan.code === "annual");
  const monthlyPrice = monthlyPlan ? formatEuro(monthlyPlan.effectivePriceCents / 100) : "19,99 EUR";
  const annualPrice = annualPlan
    ? formatEuro(annualPlan.effectivePriceCents / 100)
    : monthlyPlan
      ? formatEuro((monthlyPlan.effectivePriceCents * 12) / 100)
      : "220 EUR";

  const monthlyPlanAction = getPlanAction(sessionUser, "monthly", {
    coachHasActivePlan,
    coachActivePlanCode,
    coachHasPendingActivation,
  });

  const baseUrl = getSiteBaseUrl();
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Membresia", path: "/membresia" },
  ]);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Plataformas para trabajar como coach",
    url: `${baseUrl}/membresia`,
    description:
      "Plataforma de coaching en linea para trabajar como coach online y captar clientes con SEO, resenas y contacto directo.",
    keywords: MEMBERSHIP_KEYWORDS.join(", "),
  };

  return (
    <>
      <JsonLd data={[breadcrumb, faqSchema, webPageSchema]} />

      {checkout === "cancel" ? (
        <section className="mx-auto mt-6 w-full max-w-6xl rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">
            Pago cancelado. No se ha activado ninguna membresia. Puedes volver a intentarlo cuando quieras.
          </p>
        </section>
      ) : null}

      {coachHasPendingActivation ? (
        <section className="mx-auto mt-6 w-full max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
          <p className="text-sm font-semibold text-amber-900">
            Estamos procesando tu activacion en Stripe. Te activaremos automaticamente en cuanto se confirme el pago.
          </p>
        </section>
      ) : null}

      <MembershipCoachLanding
        annualPrice={annualPrice}
        joinHref={monthlyPlanAction.primaryHref}
        joinLabel={monthlyPlanAction.primaryLabel}
        monthlyPrice={monthlyPrice}
      />
    </>
  );
}
