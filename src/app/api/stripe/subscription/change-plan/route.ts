import type Stripe from "stripe";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { listMembershipPlansForPublic } from "@/lib/membership-plan-service";
import { prisma } from "@/lib/prisma";
import { getStripeServer, resolveStripePlanPriceConfig } from "@/lib/stripe-server";

const schema = z.object({
  planCode: z.enum(["monthly", "annual"]),
});

function isChangeableStatus(status?: string | null) {
  return status === "active" || status === "trialing" || status === "past_due";
}

function normalizeStripeStatus(status: string): "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired" {
  switch (status) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return status;
    default:
      return "incomplete";
  }
}

async function ensureTargetPriceId(input: {
  stripe: Stripe;
  currentStripeSubscription: Stripe.Subscription;
  targetPlanCode: "monthly" | "annual";
  configuredPrice: ReturnType<typeof resolveStripePlanPriceConfig>;
  publicPlan: Awaited<ReturnType<typeof listMembershipPlansForPublic>>[number];
}) {
  const { stripe, currentStripeSubscription, targetPlanCode, configuredPrice, publicPlan } = input;
  if (!configuredPrice) throw new Error("Configuracion de precio no disponible");

  const firstItem = currentStripeSubscription.items.data[0];
  const existingProductId =
    typeof firstItem?.price?.product === "string"
      ? firstItem.price.product
      : typeof firstItem?.price?.product === "object" && firstItem.price.product
        ? firstItem.price.product.id
        : null;

  const hasActiveDiscount = publicPlan.discountActive && publicPlan.effectivePriceCents < publicPlan.priceCents;
  const baseAmount = configuredPrice.unitAmountCents ?? publicPlan.priceCents;
  const unitAmount = hasActiveDiscount ? publicPlan.effectivePriceCents : baseAmount;
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    throw new Error("Precio invalido para cambio de plan");
  }

  if (configuredPrice.mode === "price_id" && configuredPrice.stripePriceId) {
    const configuredStripePrice = await stripe.prices.retrieve(configuredPrice.stripePriceId);
    const configuredProductId =
      typeof configuredStripePrice.product === "string"
        ? configuredStripePrice.product
        : configuredStripePrice.product?.id || null;

    let configuredProductActive = true;
    if (configuredProductId) {
      const configuredProduct = await stripe.products.retrieve(configuredProductId);
      configuredProductActive = Boolean(configuredProduct.active);
    }

    if (configuredStripePrice.active && configuredProductActive) {
      return configuredPrice.stripePriceId;
    }
  }

  const productId =
    existingProductId ||
    (
      await stripe.products.create({
        name: targetPlanCode === "monthly" ? "Membresia coach mensual" : "Membresia coach anual",
      })
    ).id;

  const price = await stripe.prices.create({
    currency: "eur",
    unit_amount: unitAmount,
    recurring: { interval: targetPlanCode === "monthly" ? "month" : "year" },
    product: productId,
    metadata: {
      planCode: targetPlanCode,
      generatedBy: "subscription-change-plan",
    },
  });

  return price.id;
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, ["coach", "admin"]);
    if (!auth.ok) return auth.response;
    if (!auth.user.coachProfileId) return jsonError("No se encontro perfil de coach", 400);

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const localSub = await prisma.coachSubscription.findFirst({
      where: { coachProfileId: auth.user.coachProfileId },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        planCode: true,
        status: true,
        stripeSubscriptionId: true,
      },
    });

    if (!localSub?.stripeSubscriptionId) return jsonError("No hay suscripcion de Stripe para cambiar", 404);
    if (!isChangeableStatus(localSub.status)) {
      return jsonError(`La suscripcion no se puede cambiar desde este estado (${localSub.status})`, 400);
    }
    if (localSub.planCode === parsed.data.planCode) {
      return jsonOk({ message: "Ya tienes ese plan activo", changed: false, planCode: localSub.planCode });
    }

    const publicPlans = await listMembershipPlansForPublic();
    const publicPlan = publicPlans.find((plan) => plan.code === parsed.data.planCode);
    if (!publicPlan) return jsonError("Plan de membresia no encontrado o inactivo", 404);

    const configuredPrice = resolveStripePlanPriceConfig(parsed.data.planCode);
    if (!configuredPrice) {
      return jsonError(
        `STRIPE_PRICE_${parsed.data.planCode.toUpperCase()} debe ser un 'price_xxx' o una cantidad en euros`,
        500,
      );
    }

    const stripe = getStripeServer();
    const stripeSub = await stripe.subscriptions.retrieve(localSub.stripeSubscriptionId);
    const firstItem = stripeSub.items.data[0];
    if (!firstItem?.id) return jsonError("La suscripcion de Stripe no tiene items editables", 400);

    const targetPriceId = await ensureTargetPriceId({
      stripe,
      currentStripeSubscription: stripeSub,
      targetPlanCode: parsed.data.planCode,
      configuredPrice,
      publicPlan,
    });

    const updated = await stripe.subscriptions.update(localSub.stripeSubscriptionId, {
      items: [
        {
          id: firstItem.id,
          price: targetPriceId,
          quantity: firstItem.quantity ?? 1,
        },
      ],
      proration_behavior: "create_prorations",
      payment_behavior: "allow_incomplete",
      metadata: {
        ...stripeSub.metadata,
        userId: stripeSub.metadata?.userId || auth.user.id,
        coachProfileId: stripeSub.metadata?.coachProfileId || auth.user.coachProfileId,
        planCode: parsed.data.planCode,
      },
    });

    const firstUpdatedItem = updated.items.data[0];
    const status = normalizeStripeStatus(updated.status);
    const currentPeriodStart = firstUpdatedItem?.current_period_start ? new Date(firstUpdatedItem.current_period_start * 1000) : null;
    const currentPeriodEnd = firstUpdatedItem?.current_period_end ? new Date(firstUpdatedItem.current_period_end * 1000) : null;

    const plan = await prisma.subscriptionPlan.upsert({
      where: { code: parsed.data.planCode },
      create: {
        code: parsed.data.planCode,
        name: parsed.data.planCode === "monthly" ? "Plan mensual" : "Plan anual",
        intervalLabel: parsed.data.planCode === "monthly" ? "mensual" : "anual",
        priceCents: publicPlan.priceCents,
        currency: "EUR",
        stripePriceId: configuredPrice.mode === "price_id" ? configuredPrice.stripePriceId : targetPriceId,
        isActive: true,
      },
      update: {
        priceCents: publicPlan.priceCents,
        stripePriceId: configuredPrice.mode === "price_id" ? configuredPrice.stripePriceId : targetPriceId,
        isActive: true,
      },
    });

    await prisma.coachSubscription.update({
      where: { id: localSub.id },
      data: {
        planId: plan.id,
        planCode: parsed.data.planCode,
        status,
        cancelAtPeriodEnd: Boolean(updated.cancel_at_period_end),
        currentPeriodStart,
        currentPeriodEnd,
        graceUntil: status === "past_due" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
      },
    });

    return jsonOk({
      message: "Plan actualizado",
      changed: true,
      fromPlanCode: localSub.planCode,
      toPlanCode: parsed.data.planCode,
      stripeStatus: updated.status,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
    });
  } catch (error) {
    console.error("[stripe/subscription/change-plan] error", error);
    return jsonError(
      error instanceof Error ? `No se pudo cambiar el plan: ${error.message}` : "No se pudo cambiar el plan",
      500,
    );
  }
}
