import type Stripe from "stripe";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { listMembershipPlansForPublic } from "@/lib/membership-plan-service";
import { prisma } from "@/lib/prisma";
import { getStripeServer, resolveStripePlanPriceConfig } from "@/lib/stripe-server";
import { absoluteUrl, slugify } from "@/lib/utils";

const schema = z.object({
  planCode: z.enum(["monthly", "annual"]),
  successPath: z.string().optional(),
  cancelPath: z.string().optional(),
});

function isActiveishSubscription(status?: string | null) {
  return status === "active" || status === "trialing";
}

function isRecentPendingCheckout(status?: string | null, updatedAt?: Date | null) {
  if (status !== "incomplete" || !updatedAt) return false;
  const ageMs = Date.now() - updatedAt.getTime();
  return ageMs >= 0 && ageMs < 3 * 60 * 1000;
}

async function uniqueCoachSlug(base: string) {
  const normalized = slugify(base) || "coach";
  let slug = normalized;
  let i = 2;
  while (true) {
    const existing = await prisma.coachProfile.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${normalized}-${i++}`;
  }
}

async function ensureCoachProfileForCheckout(input: {
  userId: string;
  email: string;
  displayName?: string | null;
  preferredCoachProfileId?: string | null;
}) {
  const existingProfiles = await prisma.coachProfile.findMany({
    where: { userId: input.userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true, name: true },
  });

  if (existingProfiles.length) {
    const preferred = input.preferredCoachProfileId
      ? existingProfiles.find((profile) => profile.id === input.preferredCoachProfileId)
      : null;
    return preferred || existingProfiles[0];
  }

  const name = input.displayName?.trim() || input.email.split("@")[0] || "Coach";
  const slug = await uniqueCoachSlug(name);
  return prisma.coachProfile.create({
    data: {
      userId: input.userId,
      name,
      slug,
      profileStatus: "draft",
      visibilityStatus: "inactive",
      certifiedStatus: "none",
      messagingEnabled: true,
    },
    select: { id: true, slug: true, name: true },
  });
}

async function ensureStripeCustomer(input: { userId: string; email: string; name?: string | null }) {
  const existing = await prisma.stripeCustomer.findUnique({ where: { userId: input.userId } });
  if (existing) return existing;

  const stripe = getStripeServer();
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.name || undefined,
    metadata: { userId: input.userId },
  });

  return prisma.stripeCustomer.create({
    data: {
      userId: input.userId,
      stripeCustomerId: customer.id,
    },
  });
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, ["client", "coach", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload inválido", 400, { issues: parsed.error.flatten() });

    const publicPlans = await listMembershipPlansForPublic();
    const publicPlan = publicPlans.find((plan) => plan.code === parsed.data.planCode);
    if (!publicPlan) return jsonError("Plan de membresía no encontrado o inactivo", 404);

    const priceConfig = resolveStripePlanPriceConfig(parsed.data.planCode);
    if (!priceConfig) {
      return jsonError(
        `STRIPE_PRICE_${parsed.data.planCode.toUpperCase()} debe ser un 'price_xxx' o una cantidad en euros (ej: 29 o 29.00)`,
        500,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, email: true, displayName: true, coachProfiles: { select: { id: true, slug: true, name: true } } },
    });
    if (!user) return jsonError("Usuario no encontrado", 404);

    const coachProfile =
      user.coachProfiles.find((p) => p.id === auth.user.coachProfileId) ||
      user.coachProfiles[0] ||
      (await ensureCoachProfileForCheckout({
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        preferredCoachProfileId: auth.user.coachProfileId ?? null,
      }));

    const latestSubscription = await prisma.coachSubscription.findFirst({
      where: { coachProfileId: coachProfile.id },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        status: true,
        planCode: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        updatedAt: true,
      },
    });
    if (latestSubscription && isActiveishSubscription(latestSubscription.status)) {
      return jsonError(
        `Ya tienes una suscripción ${latestSubscription.status} (${latestSubscription.planCode}). No puedes crear otra hasta cancelarla o que termine.`,
        409,
        { subscription: latestSubscription },
      );
    }
    if (latestSubscription && isRecentPendingCheckout(latestSubscription.status, latestSubscription.updatedAt)) {
      return jsonError(
        "Ya hay una activación de membresía en proceso. Espera unos segundos y revisa /membresia/confirmacion antes de reintentar.",
        409,
        {
          subscription: latestSubscription,
          nextStep: "/membresia/confirmacion",
        },
      );
    }

    const stripeCustomer = await ensureStripeCustomer({
      userId: user.id,
      email: user.email,
      name: user.displayName || coachProfile.name,
    });

    const now = new Date();
    const periodStart = now;
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (parsed.data.planCode === "monthly" ? 1 : 12));

    const plan = await prisma.subscriptionPlan.upsert({
      where: { code: parsed.data.planCode },
      create: {
        code: parsed.data.planCode,
        name: parsed.data.planCode === "monthly" ? "Plan mensual" : "Plan anual",
        intervalLabel: parsed.data.planCode === "monthly" ? "mensual" : "anual",
        priceCents: publicPlan.priceCents,
        currency: "EUR",
        stripePriceId: priceConfig.stripePriceId,
        isActive: true,
      },
      update: {
        priceCents: publicPlan.priceCents,
        stripePriceId: priceConfig.stripePriceId,
        isActive: true,
      },
    });

    const stripe = getStripeServer();
    const successUrl = absoluteUrl(
      parsed.data.successPath || `/membresia/confirmacion?checkout=success&plan=${parsed.data.planCode}`,
    );
    const cancelUrl = absoluteUrl(parsed.data.cancelPath || `/membresia?checkout=cancel&plan=${parsed.data.planCode}`);

    const hasActiveDiscount = publicPlan.discountActive && publicPlan.effectivePriceCents < publicPlan.priceCents;
    const fallbackInlineAmount = priceConfig.unitAmountCents ?? publicPlan.priceCents;
    const unitAmountForCheckout = hasActiveDiscount ? publicPlan.effectivePriceCents : fallbackInlineAmount;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      !hasActiveDiscount && priceConfig.mode === "price_id"
        ? [{ price: priceConfig.stripePriceId, quantity: 1 }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: "eur",
                unit_amount: unitAmountForCheckout,
                recurring: { interval: parsed.data.planCode === "monthly" ? "month" : "year" },
                product_data: {
                  name: parsed.data.planCode === "monthly" ? "Membresía coach mensual" : "Membresía coach anual",
                  description: hasActiveDiscount
                    ? "Perfil activo en el directorio de coaches de EncuentraTuCoach · Descuento aplicado"
                    : "Perfil activo en el directorio de coaches de EncuentraTuCoach",
                },
              },
            },
          ];

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomer.stripeCustomerId,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        coachProfileId: coachProfile.id,
        planCode: parsed.data.planCode,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          coachProfileId: coachProfile.id,
          planCode: parsed.data.planCode,
        },
      },
    });

    await prisma.coachSubscription
      .create({
        data: {
          coachProfileId: coachProfile.id,
          planId: plan.id,
          planCode: parsed.data.planCode,
          status: "incomplete",
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      })
      .catch(() => undefined);

    return jsonOk({
      sessionId: session.id,
      checkoutUrl: session.url,
      message: "Sesión de checkout creada",
    });
  } catch (error) {
    console.error("[stripe/checkout-session] error", error);
    return jsonError(
      error instanceof Error ? `No se pudo crear la sesión de pago: ${error.message}` : "No se pudo crear la sesión de pago",
      500,
    );
  }
}
