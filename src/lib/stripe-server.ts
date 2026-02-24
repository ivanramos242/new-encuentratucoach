import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripeServer() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(secretKey);
  }
  return stripeSingleton;
}

export function getStripePriceIdForPlan(planCode: "monthly" | "annual") {
  if (planCode === "monthly") return process.env.STRIPE_PRICE_MONTHLY || "";
  return process.env.STRIPE_PRICE_ANNUAL || "";
}

export function planCodeFromStripePriceId(priceId: string | null | undefined): "monthly" | "annual" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return "monthly";
  if (priceId === process.env.STRIPE_PRICE_ANNUAL) return "annual";
  return null;
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}

