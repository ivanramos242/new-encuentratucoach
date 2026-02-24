import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getStripePriceIdForPlan, getStripeServer } from "@/lib/stripe-server";
import { absoluteUrl } from "@/lib/utils";

const schema = z.object({
  planCode: z.enum(["monthly", "annual"]),
  successPath: z.string().optional(),
  cancelPath: z.string().optional(),
});

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
    const auth = await requireApiRole(request, "coach");
    if (!auth.ok) return auth.response;
    if (!auth.user.coachProfileId) return jsonError("No se encontro perfil de coach asociado a tu cuenta", 400);

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const stripePriceId = getStripePriceIdForPlan(parsed.data.planCode);
    if (!stripePriceId) return jsonError(`Falta STRIPE_PRICE_${parsed.data.planCode.toUpperCase()} en entorno`, 500);

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, email: true, displayName: true, coachProfiles: { select: { id: true, slug: true, name: true } } },
    });
    if (!user) return jsonError("Usuario no encontrado", 404);
    const coachProfile = user.coachProfiles.find((p) => p.id === auth.user.coachProfileId) || user.coachProfiles[0];
    if (!coachProfile) return jsonError("Perfil de coach no encontrado", 404);

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
        priceCents: 0,
        currency: "EUR",
        stripePriceId,
        isActive: true,
      },
      update: {
        stripePriceId,
        isActive: true,
      },
    });

    const stripe = getStripeServer();
    const successUrl = absoluteUrl(parsed.data.successPath || "/mi-cuenta/coach/membresia?checkout=success");
    const cancelUrl = absoluteUrl(parsed.data.cancelPath || "/mi-cuenta/coach/membresia?checkout=cancel");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomer.stripeCustomerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
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

    // Placeholder local snapshot to help UI before webhook finalizes state.
    await prisma.coachSubscription.create({
      data: {
        coachProfileId: coachProfile.id,
        planId: plan.id,
        planCode: parsed.data.planCode,
        status: "incomplete",
        stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    }).catch(() => undefined);

    return jsonOk({
      sessionId: session.id,
      checkoutUrl: session.url,
      message: "Sesion de checkout creada",
    });
  } catch (error) {
    console.error("[stripe/checkout-session] error", error);
    return jsonError("No se pudo crear la sesion de pago", 500);
  }
}


