import { jsonError, jsonOk, jsonServerError } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyEndpointRateLimit } from "@/lib/rate-limit";
import { getStripeIdempotencyKey } from "@/lib/stripe-idempotency";
import { getStripeServer } from "@/lib/stripe-server";

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "stripe-subscription-resume",
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
    if (!sub || !sub.stripeSubscriptionId) return jsonError("No hay suscripcion de Stripe para reactivar", 404);

    const stripe = getStripeServer();
    const updated = await stripe.subscriptions.update(
      sub.stripeSubscriptionId,
      { cancel_at_period_end: false },
      {
        idempotencyKey: getStripeIdempotencyKey(request, {
          scope: "subscription-resume",
          userId: auth.user.id,
          entityId: sub.stripeSubscriptionId,
        }),
      },
    );

    await prisma.coachSubscription.update({
      where: { id: sub.id },
      data: {
        cancelAtPeriodEnd: false,
      },
    });

    return jsonOk({
      message: "Renovacion reactivada",
      stripeStatus: updated.status,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
    });
  } catch (error) {
    console.error("[stripe/subscription/resume] error", error);
    return jsonServerError("No se pudo reactivar la suscripcion", error);
  }
}
