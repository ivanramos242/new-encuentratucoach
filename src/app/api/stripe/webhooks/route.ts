import type Stripe from "stripe";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { prisma } from "@/lib/prisma";
import { getStripeServer, getStripeWebhookSecret, planCodeFromStripePriceId } from "@/lib/stripe-server";

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

function isActiveish(status: string) {
  return status === "active" || status === "trialing";
}

async function upsertSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata || {};
  let coachProfileId = metadata.coachProfileId || "";
  let userId = metadata.userId || "";
  let planCode = (metadata.planCode as "monthly" | "annual" | undefined) || undefined;

  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : typeof subscription.customer === "object" && subscription.customer
        ? subscription.customer.id
        : "";

  const stripeCustomer = stripeCustomerId
    ? await prisma.stripeCustomer.findUnique({ where: { stripeCustomerId } })
    : null;
  if (!userId) userId = stripeCustomer?.userId || "";

  const existingByStripeId = await prisma.coachSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true, coachProfileId: true },
  });
  if (!coachProfileId) coachProfileId = existingByStripeId?.coachProfileId || "";

  if (!coachProfileId && userId) {
    const linkedCoach = await prisma.coachProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (linkedCoach) coachProfileId = linkedCoach.id;
  }

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id || null;
  if (!planCode) planCode = planCodeFromStripePriceId(priceId) || "monthly";

  const plan = await prisma.subscriptionPlan.upsert({
    where: { code: planCode },
    create: {
      code: planCode,
      name: planCode === "monthly" ? "Plan mensual" : "Plan anual",
      intervalLabel: planCode === "monthly" ? "mensual" : "anual",
      priceCents: 0,
      currency: String(firstItem?.price?.currency || "eur").toUpperCase(),
      stripePriceId: priceId,
      isActive: true,
    },
    update: {
      stripePriceId: priceId ?? undefined,
      currency: String(firstItem?.price?.currency || "eur").toUpperCase(),
      isActive: true,
    },
  });

  if (!coachProfileId) {
    // We can still store the snapshot, but not fully sync a local subscription without the local coach profile.
    return { subscriptionRecord: null, coachProfileId: null as string | null };
  }

  const status = normalizeStripeStatus(subscription.status);
  const currentPeriodStart = subscription.items.data[0]?.current_period_start
    ? new Date(subscription.items.data[0].current_period_start * 1000)
    : null;
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000)
    : null;

  const subscriptionRecord = await prisma.coachSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      coachProfileId,
      planId: plan.id,
      planCode,
      status,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      graceUntil: status === "past_due" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
    },
    update: {
      coachProfileId,
      planId: plan.id,
      planCode,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      graceUntil: status === "past_due" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
    },
  });

  await prisma.stripeSubscriptionSnapshot.create({
    data: {
      coachSubscriptionId: subscriptionRecord.id,
      stripeSubscriptionId: subscription.id,
      payload: subscription as unknown as object,
    },
  });

  const coach = await prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    select: { id: true, profileStatus: true },
  });
  if (coach) {
    await prisma.coachProfile.update({
      where: { id: coach.id },
      data: {
        visibilityStatus:
          isActiveish(status) && (coach.profileStatus === "published" || coach.profileStatus === "pending_review")
            ? "active"
            : "inactive",
      },
    });
  }

  if (userId && isActiveish(status)) {
    await prisma.user
      .updateMany({
        where: { id: userId, role: "client" },
        data: { role: "coach" },
      })
      .catch(() => undefined);
  }

  return { subscriptionRecord, coachProfileId };
}

async function processStripeEvent(event: Stripe.Event) {
  const stripe = getStripeServer();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const userId = session.metadata?.userId || null;

      if (userId && customerId) {
        await prisma.stripeCustomer.upsert({
          where: { userId },
          create: { userId, stripeCustomerId: customerId },
          update: { stripeCustomerId: customerId },
        });
      }

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscriptionFromStripe(subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await upsertSubscriptionFromStripe(subscription);
      break;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceWithSubscription = invoice as unknown as { subscription?: string | { id: string } | null };
      const stripeSubscriptionId =
        typeof invoiceWithSubscription.subscription === "string"
          ? invoiceWithSubscription.subscription
          : invoiceWithSubscription.subscription?.id || null;
      if (stripeSubscriptionId) {
        const existing = await prisma.coachSubscription.findUnique({
          where: { stripeSubscriptionId },
          select: { id: true },
        });
        if (existing) {
          const status = event.type === "invoice.paid" ? "active" : "past_due";
          await prisma.coachSubscription.update({
            where: { id: existing.id },
            data: {
              status,
              graceUntil: status === "past_due" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
            },
          });
        }
      }
      break;
    }
    default:
      break;
  }
}

export async function POST(request: Request) {
  try {
    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) return jsonError("STRIPE_WEBHOOK_SECRET no configurado", 500);

    const signature = request.headers.get("stripe-signature");
    if (!signature) return jsonError("Falta firma stripe-signature", 400);

    const payload = await request.text();
    const stripe = getStripeServer();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    const existing = await prisma.billingEventLog.findUnique({
      where: { stripeEventId: event.id },
      select: { id: true, processedAt: true },
    });
    if (existing?.processedAt) {
      return jsonOk({ received: true, duplicate: true });
    }

    const log = existing
      ? existing
      : await prisma.billingEventLog.create({
          data: {
            stripeEventId: event.id,
            eventType: event.type,
            payload: event as unknown as object,
          },
          select: { id: true },
        });

    await processStripeEvent(event);

    await prisma.billingEventLog.update({
      where: { id: log.id },
      data: { processedAt: new Date() },
    });

    return jsonOk({ received: true });
  } catch (error) {
    console.error("[stripe/webhooks] error", error);
    return jsonError("Webhook de Stripe no procesado", 400);
  }
}


