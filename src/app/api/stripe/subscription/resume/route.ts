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
    });
    if (!sub || !sub.stripeSubscriptionId) return jsonError("No hay suscripcion de Stripe para reactivar", 404);

    const stripe = getStripeServer();
    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

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
    return jsonError("No se pudo reactivar la suscripcion", 500);
  }
}
