import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getStripeServer } from "@/lib/stripe-server";

export async function POST(request: Request) {
  try {
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
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);

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
    return jsonError("No se pudo cancelar inmediatamente la suscripcion", 500);
  }
}
