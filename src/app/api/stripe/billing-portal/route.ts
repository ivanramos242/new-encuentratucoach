import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getStripeServer } from "@/lib/stripe-server";
import { absoluteUrl } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, ["coach", "admin"]);
    if (!auth.ok) return auth.response;

    const stripeCustomer = await prisma.stripeCustomer.findUnique({
      where: { userId: auth.user.id },
      select: { stripeCustomerId: true },
    });
    if (!stripeCustomer?.stripeCustomerId) {
      return jsonError("No existe cliente de Stripe asociado a esta cuenta", 400);
    }

    const stripe = getStripeServer();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomer.stripeCustomerId,
      return_url: absoluteUrl("/mi-cuenta/coach/membresia"),
    });

    return jsonOk({ url: session.url });
  } catch (error) {
    console.error("[stripe/billing-portal] error", error);
    return jsonError("No se pudo abrir el portal de Stripe", 500);
  }
}
