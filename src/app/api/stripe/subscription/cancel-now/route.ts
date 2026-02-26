import { jsonError, jsonOk, jsonServerError } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyEndpointRateLimit } from "@/lib/rate-limit";
import { getStripeIdempotencyKey } from "@/lib/stripe-idempotency";
import { getStripeServer } from "@/lib/stripe-server";

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "stripe-subscription-cancel-now",
      limit: 6,
      windowMs: 60_000,
    });
    if (rateLimited) return rateLimited;

    const auth = await requireApiRole(request, ["coach", "admin"]);
    if (!auth.ok) return auth.response;
    if (!auth.user.coachProfileId) return jsonError("No se encontro perfil de coach", 400);

    const sub = await prisma.coachSubscription.findFirst({
      where: { coachProfileId: auth.user.coachProfileId },
      orderBy: [{ updatedAt: "desc" }],
      include: { coachProfile: { select: { id: true } } },
    });

    if (!sub?.stripeSubscriptionId) return jsonError("No hay suscripcion de Stripe para cancelar", 404);

    const stripe = getStripeServer();
    await stripe.subscriptions.cancel(
      sub.stripeSubscriptionId,
      undefined,
      {
        idempotencyKey: getStripeIdempotencyKey(request, {
          scope: "subscription-cancel-now",
          userId: auth.user.id,
          entityId: sub.stripeSubscriptionId,
        }),
      },
    );

    await prisma.$transaction([
      prisma.coachSubscription.update({
        where: { id: sub.id },
        data: {
          status: "canceled",
          cancelAtPeriodEnd: false,
          graceUntil: null,
          currentPeriodEnd: new Date(),
        },
      }),
      prisma.coachProfile.update({
        where: { id: sub.coachProfileId },
        data: {
          visibilityStatus: "inactive",
        },
      }),
    ]);

    return jsonOk({ message: "Suscripcion cancelada inmediatamente" });
  } catch (error) {
    console.error("[stripe/subscription/cancel-now] error", error);
    return jsonServerError("No se pudo cancelar inmediatamente la suscripcion", error);
  }
}
