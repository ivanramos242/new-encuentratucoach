import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { getOptionalSessionUser } from "@/lib/auth-server";
import { listMembershipPlansForPublic } from "@/lib/membership-plan-service";
import { prisma } from "@/lib/prisma";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteBaseUrl } from "@/lib/site-config";
import { formatEuro } from "@/lib/utils";

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

const COACH_ADVANTAGES = [
  "Perfil profesional orientado a conversion por especialidad y ciudad.",
  "Visibilidad SEO en landings transaccionales del directorio.",
  "Contacto directo con clientes sin comision por lead.",
  "Reseñas y certificacion para reforzar confianza.",
  "Metricas para optimizar clics y conversion por nicho.",
  "Mensajeria interna para responder rapido y cerrar antes.",
  "Modelo de cuota fija para proteger margen.",
  "Pensada para coaches que quieren trabajar online y presencial.",
] as const;

const FAQ_ITEMS = [
  {
    q: "Que diferencia a esta plataforma frente a otras plataformas para trabajar como coach?",
    a: "Se centra en demanda con intencion real de compra, SEO por ciudad y especialidad, y contacto directo sin comisiones.",
  },
  {
    q: "Puedo usar la plataforma si quiero trabajar como coach online?",
    a: "Si. Puedes activar modalidad online, presencial o ambas y aparecer en rutas de descubrimiento por modalidad.",
  },
  {
    q: "Hay comision por cada cliente conseguido?",
    a: "No. El modelo es de membresia fija, sin comision por contacto.",
  },
  {
    q: "Como mejoro resultados dentro de la plataforma?",
    a: "Con perfil completo, propuesta de valor clara, reseñas activas y seguimiento semanal de metricas de clic y contacto.",
  },
] as const;

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Plataforma para trabajar como coach online",
  description:
    "Membresia para coaches en una plataforma de coaching online con SEO, reseñas y contacto directo. Diseñada para trabajar como coach y captar clientes en España.",
  path: "/membresia",
  keywords: MEMBERSHIP_KEYWORDS as unknown as string[],
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
  return [
    "Perfil publico activo",
    "SEO en directorio y landings",
    "Reseñas y certificacion",
    "Metricas basicas V1",
  ];
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
      primaryLabel: "Procesando activacion",
      secondaryHref: sessionUser.role === "client" ? "/mi-cuenta/cliente" : "/mi-cuenta/coach/membresia",
      secondaryLabel: "Ver estado",
    };
  }

  if (sessionUser.role === "client") {
    return {
      primaryHref: `/membresia/checkout?plan=${planCode}`,
      primaryLabel: "Pagar membresia",
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
      primaryLabel: "Pagar membresia",
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
    name: "Plataforma de coaching para trabajar como coach online",
    url: `${baseUrl}/membresia`,
    description:
      "Plataforma de coaching en linea para coaches que buscan visibilidad, reseñas y captacion de clientes sin comisiones.",
    keywords: MEMBERSHIP_KEYWORDS.join(", "),
  };

  return (
    <>
      <JsonLd data={[breadcrumb, faqSchema, webPageSchema]} />
      <PageHero
        badge="Plataforma de coaching online para profesionales"
        title="Membresia para trabajar como coach online"
        description="Si estas comparando plataformas para trabajar como coach, aqui tienes una plataforma especializada con SEO, reseñas y contacto directo."
      />
      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            Plataformas para trabajar como coach: que mirar antes de pagar
          </h2>
          <p className="mt-3 text-zinc-700">
            Una plataforma de coaching que realmente te ayude a captar clientes necesita tres piezas: trafico con
            intencion, confianza en el perfil y contacto directo. Esta pagina de membresia esta diseñada para eso.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="#planes"
              className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ver planes de membresia
            </Link>
            <Link
              href="/plataformas-para-trabajar-como-coach"
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Ver comparativa completa
            </Link>
            <Link
              href="/coaches"
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Ver directorio de coaches
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            Plataforma especializada vs plataformas genericas
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <h3 className="text-lg font-black text-zinc-950">Plataforma especializada para coaching</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                <li>Landings SEO por ciudad y especialidad.</li>
                <li>Perfiles con reseñas y señales de confianza.</li>
                <li>Contacto directo para reducir friccion de cierre.</li>
              </ul>
            </article>
            <article className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <h3 className="text-lg font-black text-zinc-950">Plataformas genericas de servicios</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                <li>Menor control de posicionamiento por nicho.</li>
                <li>Mayor competencia por perfil sin contexto.</li>
                <li>Conversion menos predecible en coaching online.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            8 ventajas para trabajar como coach en linea con esta plataforma
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {COACH_ADVANTAGES.map((item, index) => (
              <article key={item} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Ventaja {index + 1}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-800">{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Como funciona en 3 pasos</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {[
              ["1. Activa tu cuenta", "Crea tu cuenta, elige plan y publica tu perfil de coach."],
              ["2. Optimiza tu oferta", "Define nicho, propuesta de valor y CTA para trabajar como coach online."],
              ["3. Convierte con datos", "Recibe contactos, mide clics y mejora tu perfil semana a semana."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <h3 className="text-lg font-black text-zinc-950">{title}</h3>
                <p className="mt-2 text-sm text-zinc-700">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {checkout === "cancel" ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">
              Pago cancelado. No se ha activado ninguna membresia. Puedes volver a intentarlo cuando quieras.
            </p>
          </div>
        ) : null}

        {coachHasPendingActivation ? (
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-black tracking-wide text-amber-800">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500" aria-hidden="true" />
                  Procesando activacion
                </p>
                <h2 className="mt-2 text-lg font-black tracking-tight text-zinc-950">
                  Estamos confirmando tu pago y activando tu cuenta coach
                </h2>
                <p className="mt-1 text-sm text-zinc-700">
                  Stripe esta terminando de procesar la suscripcion. En cuanto llegue la confirmacion, te activaremos
                  automaticamente como coach.
                </p>
              </div>
              <Link
                href="/membresia/confirmacion"
                className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Ver estado de activacion
              </Link>
            </div>
          </div>
        ) : null}

        <section id="planes" className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Planes de membresia para coaches</h2>
          <p className="mt-2 text-zinc-700">
            Sin comision por cliente. Tu eliges plan mensual o anual segun el ritmo de crecimiento de tu plataforma de
            coaching en linea.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
                      <h3 className="text-2xl font-black tracking-tight text-zinc-950">{plan.name}</h3>
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
                      ? "Ideal para validar la plataforma y empezar a trabajar como coach con visibilidad inmediata."
                      : "Mejor coste anual para consolidar posicionamiento y flujo continuo de leads."}
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
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            FAQ sobre plataforma de coaching y membresia
          </h2>
          <div className="mt-4 grid gap-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <summary className="cursor-pointer text-base font-black text-zinc-900">{item.q}</summary>
                <p className="mt-2 text-sm text-zinc-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  );
}
