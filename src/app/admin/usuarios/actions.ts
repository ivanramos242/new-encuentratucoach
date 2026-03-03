"use server";

import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";
import { requireRole } from "@/lib/auth-server";
import { setImpersonationCookieForServerAction } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { getStripeServer } from "@/lib/stripe-server";

function getString(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

async function uniqueCoachSlug(base: string, findBySlug: (slug: string) => Promise<{ id: string } | null>) {
  const normalized = slugify(base) || "coach";
  let slug = normalized;
  let i = 2;
  while (await findBySlug(slug)) {
    slug = `${normalized}-${i++}`;
  }
  return slug;
}

function buildCoachName(input: { displayName?: string | null; email: string }) {
  return (input.displayName || input.email.split("@")[0] || "Coach").trim();
}

function isStripeCustomerId(value: string) {
  return /^cus_[A-Za-z0-9]+$/.test(value);
}

function stripeErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const maybe = error as { code?: string; raw?: { code?: string } };
  return maybe.code || maybe.raw?.code || "";
}

function extractStripeCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  if (!customer) return "";
  if (typeof customer === "string") return customer;
  if ("id" in customer && typeof customer.id === "string") return customer.id;
  return "";
}

function isStripeSubscriptionId(value: string) {
  return /^sub_[A-Za-z0-9]+$/.test(value);
}

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

function isActiveishStatus(status: string) {
  return status === "active" || status === "trialing";
}

function planCodeFromSubscription(subscription: Stripe.Subscription): "monthly" | "annual" {
  const metadataPlanCode = subscription.metadata?.planCode;
  if (metadataPlanCode === "monthly" || metadataPlanCode === "annual") return metadataPlanCode;

  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  return interval === "year" ? "annual" : "monthly";
}

function subscriptionRank(status: string) {
  switch (status) {
    case "active":
      return 7;
    case "trialing":
      return 6;
    case "past_due":
      return 5;
    case "unpaid":
      return 4;
    case "incomplete":
      return 3;
    case "canceled":
      return 2;
    case "incomplete_expired":
      return 1;
    default:
      return 0;
  }
}

function pickBestStripeSubscription(subs: Stripe.Subscription[]) {
  const sorted = [...subs].sort((a, b) => {
    const rankDiff = subscriptionRank(b.status) - subscriptionRank(a.status);
    if (rankDiff !== 0) return rankDiff;
    const aPeriodEnd = a.items.data[0]?.current_period_end || 0;
    const bPeriodEnd = b.items.data[0]?.current_period_end || 0;
    if (bPeriodEnd !== aPeriodEnd) return bPeriodEnd - aPeriodEnd;
    return b.created - a.created;
  });
  return sorted[0] || null;
}

async function uniqueCoachSlugForSubscriptionSync(base: string) {
  const normalized = slugify(base) || "coach";
  let slug = normalized;
  let i = 2;
  while (true) {
    const existing = await prisma.coachProfile.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${normalized}-${i++}`;
  }
}

async function ensureCoachProfileForUser(user: { id: string; email: string; displayName: string | null }) {
  const existing = await prisma.coachProfile.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existing) return existing.id;

  const name = buildCoachName({ displayName: user.displayName, email: user.email });
  const slug = await uniqueCoachSlugForSubscriptionSync(name);
  const created = await prisma.coachProfile.create({
    data: {
      userId: user.id,
      name,
      slug,
      profileStatus: "draft",
      visibilityStatus: "inactive",
      certifiedStatus: "none",
      messagingEnabled: true,
    },
    select: { id: true },
  });
  return created.id;
}

function userHomePathByRole(role: "admin" | "coach" | "client") {
  if (role === "coach") return "/mi-cuenta/coach";
  if (role === "client") return "/mi-cuenta/cliente";
  return "/admin";
}

export async function impersonateUserAction(formData: FormData) {
  const adminUser = await requireRole("admin", { returnTo: "/admin/usuarios" });

  const userId = getString(formData, "userId");
  if (!userId) redirect("/admin/usuarios?error=impersonate-invalid-payload");

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!targetUser) redirect("/admin/usuarios?error=impersonate-not-found");
  if (targetUser.id === adminUser.id || targetUser.role === "admin") {
    redirect("/admin/usuarios?error=impersonate-admin-not-allowed");
  }
  if (!targetUser.isActive) redirect("/admin/usuarios?error=impersonate-inactive");

  await setImpersonationCookieForServerAction(targetUser.id);
  redirect(userHomePathByRole(targetUser.role));
}

export async function setUserStripeCustomerIdAction(formData: FormData) {
  await requireRole("admin", { returnTo: "/admin/usuarios" });

  const userId = getString(formData, "userId");
  const stripeCustomerId = getString(formData, "stripeCustomerId");
  if (!userId || !stripeCustomerId) redirect("/admin/usuarios?error=stripe-invalid-payload");
  if (!isStripeCustomerId(stripeCustomerId)) {
    redirect("/admin/usuarios?error=stripe-invalid-format");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) redirect("/admin/usuarios?error=stripe-not-found");
  if (user.role === "admin") redirect("/admin/usuarios?error=stripe-admin-not-editable");

  const linkedToOtherUser = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId },
    select: { userId: true },
  });
  if (linkedToOtherUser && linkedToOtherUser.userId !== user.id) {
    redirect("/admin/usuarios?error=stripe-customer-already-linked");
  }

  try {
    const stripe = getStripeServer();
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if ("deleted" in customer && customer.deleted) {
      redirect("/admin/usuarios?error=stripe-customer-deleted");
    }
  } catch (error) {
    const code = stripeErrorCode(error);
    if (code === "resource_missing") redirect("/admin/usuarios?error=stripe-customer-not-found");
    redirect("/admin/usuarios?error=stripe-validate-failed");
  }

  await prisma.stripeCustomer.upsert({
    where: { userId: user.id },
    create: { userId: user.id, stripeCustomerId },
    update: { stripeCustomerId },
  });

  revalidatePath("/admin/usuarios");
  const successParams = new URLSearchParams({
    stripeLinked: "1",
    stripeEmail: user.email,
    stripeCustomerId,
  });
  redirect(`/admin/usuarios?${successParams.toString()}`);
}

export async function syncUserStripeSubscriptionAction(formData: FormData) {
  await requireRole("admin", { returnTo: "/admin/usuarios" });

  const userId = getString(formData, "userId");
  const forcedStripeSubscriptionId = getString(formData, "stripeSubscriptionId");
  if (!userId) redirect("/admin/usuarios?error=stripe-sync-invalid-payload");
  if (forcedStripeSubscriptionId && !isStripeSubscriptionId(forcedStripeSubscriptionId)) {
    redirect("/admin/usuarios?error=stripe-sync-invalid-subscription-format");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      email: true,
      displayName: true,
      stripeCustomer: { select: { stripeCustomerId: true } },
    },
  });
  if (!user) redirect("/admin/usuarios?error=stripe-sync-not-found");
  if (user.role === "admin") redirect("/admin/usuarios?error=stripe-sync-admin-not-editable");
  if (!user.stripeCustomer?.stripeCustomerId) redirect("/admin/usuarios?error=stripe-sync-missing-customer");

  const stripe = getStripeServer();
  let stripeSubscription: Stripe.Subscription | null = null;
  let stripeCustomerId = user.stripeCustomer.stripeCustomerId;

  try {
    if (forcedStripeSubscriptionId) {
      const forcedSub = await stripe.subscriptions.retrieve(forcedStripeSubscriptionId);
      const subCustomerId = extractStripeCustomerId(forcedSub.customer);
      if (!subCustomerId) redirect("/admin/usuarios?error=stripe-sync-subscription-without-customer");
      stripeSubscription = forcedSub;
      stripeCustomerId = subCustomerId;
    } else {
      const list = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 20,
      });
      if (!list.data.length) redirect("/admin/usuarios?error=stripe-sync-no-subscriptions");
      stripeSubscription = pickBestStripeSubscription(list.data);
    }
  } catch (error) {
    const code = stripeErrorCode(error);
    if (code === "resource_missing") redirect("/admin/usuarios?error=stripe-sync-subscription-not-found");
    redirect("/admin/usuarios?error=stripe-sync-fetch-failed");
  }

  if (!stripeSubscription) redirect("/admin/usuarios?error=stripe-sync-no-subscriptions");

  // If admin forced a subscription from a different customer, reconcile local mapping when possible.
  if (stripeCustomerId !== user.stripeCustomer.stripeCustomerId) {
    const alreadyLinked = await prisma.stripeCustomer.findUnique({
      where: { stripeCustomerId },
      select: { userId: true },
    });
    if (alreadyLinked && alreadyLinked.userId !== user.id) {
      redirect("/admin/usuarios?error=stripe-sync-customer-linked-to-other-user");
    }
    await prisma.stripeCustomer.upsert({
      where: { userId: user.id },
      create: { userId: user.id, stripeCustomerId },
      update: { stripeCustomerId },
    });
  }

  const coachProfileId = await ensureCoachProfileForUser(user);

  const firstItem = stripeSubscription.items.data[0];
  const priceId = firstItem?.price?.id || null;
  const currency = String(firstItem?.price?.currency || "eur").toUpperCase();
  const planCode = planCodeFromSubscription(stripeSubscription);

  const plan = await prisma.subscriptionPlan.upsert({
    where: { code: planCode },
    create: {
      code: planCode,
      name: planCode === "monthly" ? "Plan mensual" : "Plan anual",
      intervalLabel: planCode === "monthly" ? "mensual" : "anual",
      priceCents: 0,
      currency,
      stripePriceId: priceId,
      isActive: true,
    },
    update: {
      currency,
      stripePriceId: priceId ?? undefined,
      isActive: true,
    },
  });

  const status = normalizeStripeStatus(stripeSubscription.status);
  const currentPeriodStart = firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000) : null;
  const currentPeriodEnd = firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000) : null;

  const subscriptionRecord = await prisma.coachSubscription.upsert({
    where: { stripeSubscriptionId: stripeSubscription.id },
    create: {
      coachProfileId,
      planId: plan.id,
      planCode,
      status,
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
      graceUntil: status === "past_due" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
    },
    update: {
      coachProfileId,
      planId: plan.id,
      planCode,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
      graceUntil: status === "past_due" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
    },
  });

  await prisma.stripeSubscriptionSnapshot.create({
    data: {
      coachSubscriptionId: subscriptionRecord.id,
      stripeSubscriptionId: stripeSubscription.id,
      payload: stripeSubscription as unknown as object,
    },
  });

  if (isActiveishStatus(status)) {
    await prisma.user
      .updateMany({
        where: { id: user.id, role: "client" },
        data: { role: "coach" },
      })
      .catch(() => undefined);
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");
  revalidatePath("/membresia");
  revalidatePath("/mi-cuenta/coach/membresia");

  const successParams = new URLSearchParams({
    stripeSynced: "1",
    stripeEmail: user.email,
    stripeSubscriptionId: stripeSubscription.id,
    stripeStatus: status,
    stripePlanCode: planCode,
  });
  redirect(`/admin/usuarios?${successParams.toString()}`);
}

export async function changeUserRoleAction(formData: FormData) {
  await requireRole("admin", { returnTo: "/admin/usuarios" });

  const userId = getString(formData, "userId");
  const targetRole = getString(formData, "targetRole");
  if (!userId || (targetRole !== "client" && targetRole !== "coach")) {
    redirect("/admin/usuarios?error=invalid-payload");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      coachProfiles: {
        select: { id: true },
      },
    },
  });

  if (!user) redirect("/admin/usuarios?error=not-found");
  if (user.role === "admin") redirect("/admin/usuarios?error=admin-not-editable");

  if (user.role === targetRole) {
    const sameParams = new URLSearchParams({
      updated: "1",
      email: user.email,
      from: user.role,
      to: targetRole,
      createdCoach: "0",
      drafted: "0",
    });
    redirect(`/admin/usuarios?${sameParams.toString()}`);
  }

  let createdCoachProfile = 0;
  let draftedProfiles = 0;

  await prisma.$transaction(async (tx) => {
    if (targetRole === "coach") {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "coach" },
      });

      if (!user.coachProfiles.length) {
        const name = buildCoachName({ displayName: user.displayName, email: user.email });
        const slug = await uniqueCoachSlug(name, (nextSlug) =>
          tx.coachProfile.findUnique({ where: { slug: nextSlug }, select: { id: true } }),
        );
        await tx.coachProfile.create({
          data: {
            userId: user.id,
            name,
            slug,
            profileStatus: "draft",
            visibilityStatus: "inactive",
            certifiedStatus: "none",
            messagingEnabled: true,
          },
        });
        createdCoachProfile = 1;
      }
    } else {
      await tx.user.update({
        where: { id: user.id },
        data: { role: "client" },
      });

      const drafted = await tx.coachProfile.updateMany({
        where: { userId: user.id },
        data: {
          profileStatus: "draft",
          visibilityStatus: "inactive",
        },
      });
      draftedProfiles = drafted.count;
    }

    await tx.authSession.deleteMany({
      where: { userId: user.id },
    });
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");

  const params = new URLSearchParams({
    updated: "1",
    email: user.email,
    from: user.role,
    to: targetRole,
    createdCoach: String(createdCoachProfile),
    drafted: String(draftedProfiles),
  });
  redirect(`/admin/usuarios?${params.toString()}`);
}
