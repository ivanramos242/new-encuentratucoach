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

export type StripePlanPriceConfig =
  | { mode: "price_id"; rawValue: string; stripePriceId: string; unitAmountCents: null }
  | { mode: "inline_amount"; rawValue: string; stripePriceId: null; unitAmountCents: number };

export function resolveStripePlanPriceConfig(planCode: "monthly" | "annual"): StripePlanPriceConfig | null {
  const rawValue = getStripePriceIdForPlan(planCode).trim();
  if (!rawValue) return null;

  if (rawValue.startsWith("price_")) {
    return {
      mode: "price_id",
      rawValue,
      stripePriceId: rawValue,
      unitAmountCents: null,
    };
  }

  const normalized = rawValue.replace(",", ".");
  const numeric = Number(normalized);
  if (Number.isFinite(numeric) && numeric > 0) {
    return {
      mode: "inline_amount",
      rawValue,
      stripePriceId: null,
      unitAmountCents: Math.round(numeric * 100),
    };
  }

  return null;
}

export function planCodeFromStripePriceId(priceId: string | null | undefined): "monthly" | "annual" | null {
  if (!priceId) return null;
  if ((process.env.STRIPE_PRICE_MONTHLY || "").startsWith("price_") && priceId === process.env.STRIPE_PRICE_MONTHLY) return "monthly";
  if ((process.env.STRIPE_PRICE_ANNUAL || "").startsWith("price_") && priceId === process.env.STRIPE_PRICE_ANNUAL) return "annual";
  return null;
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}
