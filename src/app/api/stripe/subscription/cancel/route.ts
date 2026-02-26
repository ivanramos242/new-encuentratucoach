import { jsonError, jsonOk, jsonServerError } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyEndpointRateLimit } from "@/lib/rate-limit";
import { getStripeIdempotencyKey } from "@/lib/stripe-idempotency";
import { getStripeServer } from "@/lib/stripe-server";

function isActiveish(status?: string | null) {
  return status === "active" || status === "trialing" || status === "past_due";
}

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "stripe-subscription-cancel",
      limit: 10,
      windowMs: 60_000,
    });
    if (rateLimited) return rateLimited;

    const auth = await requireApiRole(request, ["coach", "admin"]);
    if (!auth.ok) return auth.response;
    if (!auth.user.coachProfileId) return jsonError("No se encontro perfil de coach", 400);

    const sub = await prisma.coachSubscription.findFirst({
      where: { coachProfileId: auth.user.coachProfileId },
      orderBy: [{ updatedAt: "desc" }],
    });
    if (!sub || !sub.stripeSubscriptionId) return jsonError("No hay suscripcion de Stripe activa para cancelar", 404);
    if (!isActiveish(sub.status)) return jsonError(`La suscripcion no se puede cancelar desde este estado (${sub.status})`, 400);

    const stripe = getStripeServer();
    const updated = await stripe.subscriptions.update(
      sub.stripeSubscriptionId,
      { cancel_at_period_end: true },
      {
        idempotencyKey: getStripeIdempotencyKey(request, {
          scope: "subscription-cancel",
          userId: auth.user.id,
          entityId: sub.stripeSubscriptionId,
        }),
      },
    );

    await prisma.coachSubscription.update({
      where: { id: sub.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return jsonOk({
      message: "Suscripcion configurada para cancelarse al final del periodo",
      stripeStatus: updated.status,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
    });
  } catch (error) {
    console.error("[stripe/subscription/cancel] error", error);
    return jsonServerError("No se pudo cancelar la suscripcion", error);
  }
}
