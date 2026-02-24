import type { SubscriptionPlanCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MembershipPlanView = {
  id: string;
  code: SubscriptionPlanCode;
  name: string;
  intervalLabel: string;
  currency: string;
  priceCents: number;
  stripePriceId: string | null;
  isActive: boolean;
  discountPercent: number | null;
  discountLabel: string | null;
  discountEndsAt: Date | null;
  effectivePriceCents: number;
  discountActive: boolean;
};

const DEFAULT_PLAN_DEFS: Record<
  SubscriptionPlanCode,
  { name: string; intervalLabel: string; priceCents: number; currency: string }
> = {
  monthly: { name: "Plan mensual", intervalLabel: "mes", priceCents: 2900, currency: "EUR" },
  annual: { name: "Plan anual", intervalLabel: "año", priceCents: 29000, currency: "EUR" },
};

function isDiscountActive(input: { percent: number | null; endsAt: Date | null; now?: Date }) {
  if (!input.percent || input.percent <= 0) return false;
  const now = input.now ?? new Date();
  if (input.endsAt && input.endsAt.getTime() < now.getTime()) return false;
  return true;
}

function effectivePrice(priceCents: number, discountPercent: number | null, active: boolean) {
  if (!active || !discountPercent) return priceCents;
  return Math.max(0, Math.round(priceCents * (1 - discountPercent / 100)));
}

export async function ensureDefaultSubscriptionPlans() {
  const priceMonthly = process.env.STRIPE_PRICE_MONTHLY || null;
  const priceAnnual = process.env.STRIPE_PRICE_ANNUAL || null;

  await prisma.subscriptionPlan.upsert({
    where: { code: "monthly" },
    create: {
      code: "monthly",
      ...DEFAULT_PLAN_DEFS.monthly,
      stripePriceId: priceMonthly,
      isActive: true,
    },
    update: {
      stripePriceId: priceMonthly || undefined,
      isActive: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: "annual" },
    create: {
      code: "annual",
      ...DEFAULT_PLAN_DEFS.annual,
      stripePriceId: priceAnnual,
      isActive: true,
    },
    update: {
      stripePriceId: priceAnnual || undefined,
      isActive: true,
    },
  });
}

export async function listMembershipPlansForPublic(): Promise<MembershipPlanView[]> {
  await ensureDefaultSubscriptionPlans();
  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { code: "asc" } });
  const now = new Date();
  return plans.map((plan) => {
    const discountActive = isDiscountActive({
      percent: plan.discountPercent,
      endsAt: plan.discountEndsAt,
      now,
    });
    return {
      ...plan,
      effectivePriceCents: effectivePrice(plan.priceCents, plan.discountPercent, discountActive),
      discountActive,
    };
  });
}

export async function listMembershipPlansForAdmin() {
  await ensureDefaultSubscriptionPlans();
  return prisma.subscriptionPlan.findMany({ orderBy: { code: "asc" } });
}

export async function upsertMembershipPlanDiscount(input: {
  code: SubscriptionPlanCode;
  priceCents?: number;
  discountPercent?: number | null;
  discountLabel?: string | null;
  discountEndsAt?: Date | null;
  isActive?: boolean;
}) {
  await ensureDefaultSubscriptionPlans();
  const base = DEFAULT_PLAN_DEFS[input.code];
  return prisma.subscriptionPlan.upsert({
    where: { code: input.code },
    create: {
      code: input.code,
      name: base.name,
      intervalLabel: base.intervalLabel,
      priceCents: input.priceCents ?? base.priceCents,
      currency: base.currency,
      discountPercent: input.discountPercent ?? null,
      discountLabel: input.discountLabel ?? null,
      discountEndsAt: input.discountEndsAt ?? null,
      stripePriceId: input.code === "monthly" ? process.env.STRIPE_PRICE_MONTHLY || null : process.env.STRIPE_PRICE_ANNUAL || null,
      isActive: input.isActive ?? true,
    },
    update: {
      priceCents: input.priceCents ?? undefined,
      discountPercent: input.discountPercent ?? null,
      discountLabel: input.discountLabel ?? null,
      discountEndsAt: input.discountEndsAt ?? null,
      isActive: input.isActive ?? undefined,
      stripePriceId: input.code === "monthly" ? process.env.STRIPE_PRICE_MONTHLY || null : process.env.STRIPE_PRICE_ANNUAL || null,
    },
  });
}

