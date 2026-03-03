import type Stripe from "stripe";
import { jsonError, jsonOk, jsonServerError } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { applyEndpointRateLimit } from "@/lib/rate-limit";
import { getStripeServer } from "@/lib/stripe-server";
import { absoluteUrl } from "@/lib/utils";

function extractStripeCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  if ("id" in customer && typeof customer.id === "string") return customer.id;
  return null;
}

function stripeErrorDetails(error: unknown) {
  const err = error as {
    code?: string;
    param?: string;
    type?: string;
    message?: string;
    raw?: { code?: string; param?: string; type?: string; message?: string };
    requestId?: string;
  };
  return {
    code: err?.code || err?.raw?.code || "",
    param: err?.param || err?.raw?.param || "",
    type: err?.type || err?.raw?.type || "",
    message: err?.message || err?.raw?.message || "",
    requestId: err?.requestId || "",
  };
}

function isStripeMissingCustomerError(error: unknown) {
  const d = stripeErrorDetails(error);
  return (
    d.code === "resource_missing" &&
    (d.param === "customer" || /no such customer/i.test(d.message))
  );
}

function isStripePortalConfigurationError(error: unknown) {
  const d = stripeErrorDetails(error);
  return (
    d.param === "configuration" ||
    /no configuration provided/i.test(d.message) ||
    /billing portal/i.test(d.message)
  );
}

async function pickCustomerByEmailWithActiveSubscription(stripe: Stripe, email: string) {
  const list = await stripe.customers.list({ email, limit: 10 });
  if (!list.data.length) return null;

  for (const customer of list.data) {
    const customerId = extractStripeCustomerId(customer);
    if (!customerId) continue;
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 5 });
    const hasActiveish = subs.data.some((sub) =>
      ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(sub.status),
    );
    if (hasActiveish) return customerId;
  }

  return extractStripeCustomerId(list.data[0]) || null;
}

async function recoverStripeCustomerIdFromLatestSubscription(stripe: Stripe, userId: string) {
  const latestSub = await prisma.coachSubscription.findFirst({
    where: {
      stripeSubscriptionId: { not: null },
      coachProfile: { userId },
    },
    select: { stripeSubscriptionId: true },
    orderBy: { updatedAt: "desc" },
  });
  const stripeSubscriptionId = latestSub?.stripeSubscriptionId;
  if (!stripeSubscriptionId) return null;

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  return extractStripeCustomerId(stripeSub.customer);
}

async function resolveStripeCustomerIdForUser(input: { stripe: Stripe; userId: string; ignoreStored?: boolean }) {
  const { stripe, userId, ignoreStored = false } = input;

  if (!ignoreStored) {
    const existing = await prisma.stripeCustomer.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    });
    if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) return null;

  let recoveredCustomerId: string | null = null;

  try {
    recoveredCustomerId = await recoverStripeCustomerIdFromLatestSubscription(stripe, userId);
  } catch (error) {
    if (!isStripeMissingCustomerError(error)) {
      console.warn("[stripe/billing-portal] recover by latest subscription failed", { userId, error });
    }
  }

  if (!recoveredCustomerId) {
    try {
      recoveredCustomerId = await pickCustomerByEmailWithActiveSubscription(stripe, user.email);
    } catch (error) {
      console.warn("[stripe/billing-portal] recover by email failed", { userId, email: user.email, error });
    }
  }

  if (!recoveredCustomerId) return null;

  await prisma.stripeCustomer.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: recoveredCustomerId },
    update: { stripeCustomerId: recoveredCustomerId },
  });

  return recoveredCustomerId;
}

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "stripe-billing-portal",
      limit: 15,
      windowMs: 60_000,
    });
    if (rateLimited) return rateLimited;

    const auth = await requireApiRole(request, ["coach", "admin"]);
    if (!auth.ok) return auth.response;

    const stripe = getStripeServer();
    let stripeCustomerId = await resolveStripeCustomerIdForUser({
      stripe,
      userId: auth.user.id,
    });

    if (!stripeCustomerId) {
      return jsonError("No existe cliente de Stripe asociado a esta cuenta", 400);
    }

    let session: Stripe.BillingPortal.Session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: absoluteUrl("/mi-cuenta/coach/membresia"),
      });
    } catch (error) {
      if (isStripeMissingCustomerError(error)) {
        const refreshedCustomerId = await resolveStripeCustomerIdForUser({
          stripe,
          userId: auth.user.id,
          ignoreStored: true,
        });
        if (!refreshedCustomerId) {
          return jsonError("No se pudo sincronizar el cliente de Stripe para esta cuenta", 409);
        }
        stripeCustomerId = refreshedCustomerId;
        session = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: absoluteUrl("/mi-cuenta/coach/membresia"),
        });
      } else if (isStripePortalConfigurationError(error)) {
        return jsonError("Stripe Customer Portal no esta configurado en esta cuenta de Stripe", 500);
      } else {
        throw error;
      }
    }

    return jsonOk({ url: session.url });
  } catch (error) {
    console.error("[stripe/billing-portal] error", error);
    return jsonServerError("No se pudo abrir el portal de Stripe", error);
  }
}
