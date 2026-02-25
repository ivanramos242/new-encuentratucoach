import { MembershipCheckoutCard } from "@/components/coach/membership-checkout-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";
import { prisma } from "@/lib/prisma";

const PENDING_ACTIVATION_WINDOW_MS = 3 * 60 * 1000;

function isActiveish(status?: string | null) {
  return status === "active" || status === "trialing";
}

function isRecentPendingActivation(status?: string | null, updatedAt?: Date | null) {
  if (status !== "incomplete" || !updatedAt) return false;
  const ageMs = Date.now() - updatedAt.getTime();
  return ageMs >= 0 && ageMs < PENDING_ACTIVATION_WINDOW_MS;
}

function pick(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

function isPlanCode(value: string | undefined): value is "monthly" | "annual" {
  return value === "monthly" || value === "annual";
}

function getProfileCompletionSummary(profile: Awaited<ReturnType<typeof getCoachProfileForEditor>>) {
  const checks = [
    { ok: Boolean(profile?.name?.trim()), label: "nombre visible" },
    { ok: Boolean(profile?.bio?.trim() || (profile as { aboutHtml?: string | null } | null)?.aboutHtml?.trim()), label: "sobre mi" },
    { ok: Boolean(profile?.pricing?.basePriceEur), label: "precio base" },
    { ok: Boolean(profile?.location?.city?.trim()), label: "ciudad" },
    { ok: Boolean((profile?.sessionModes?.length || 0) > 0), label: "modalidad" },
  ];
  const done = checks.filter((c) => c.ok).length;
  const pending = checks.filter((c) => !c.ok).map((c) => c.label);
  return {
    done,
    total: checks.length,
    pending,
  };
}

export default async function CoachMembershipPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach/membresia" });
  const profile = await getCoachProfileForEditor(user);
  const params = (await searchParams) || {};
  const checkoutStatus = pick(params.checkout);
  const checkoutPlan = pick(params.plan);
  const completion = getProfileCompletionSummary(profile);

  let sub = profile?.subscriptions?.[0] ?? null;
  if (
    checkoutStatus === "cancel" &&
    sub &&
    sub.status === "incomplete" &&
    isRecentPendingActivation(sub.status, sub.updatedAt)
  ) {
    await prisma.coachSubscription
      .update({
        where: { id: sub.id },
        data: { status: "canceled" },
      })
      .catch(() => undefined);
    sub = { ...sub, status: "canceled" } as typeof sub;
  }

  const pendingActivation = isRecentPendingActivation(sub?.status, sub?.updatedAt);
  const subPlanCode = sub?.planCode ?? undefined;
  const pendingPlanCode: "monthly" | "annual" = isPlanCode(checkoutPlan)
    ? checkoutPlan
    : isPlanCode(subPlanCode)
      ? subPlanCode
      : "monthly";
  const pendingUntilEpochMs = sub?.updatedAt ? sub.updatedAt.getTime() + PENDING_ACTIVATION_WINDOW_MS : null;

  const shouldShowOnboardingCta =
    checkoutStatus === "success" &&
    isActiveish(sub?.status) &&
    (profile?.profileStatus !== "published" || completion.done < completion.total);
  const onboardingStepSummary =
    completion.done < completion.total
      ? `Te faltan ${completion.total - completion.done} pasos: ${completion.pending.join(", ")}.`
      : "Ya puedes revisar y publicar tu perfil.";

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Mi membresía"
        description="Activa tu suscripción Stripe para publicar el perfil y mantenerlo visible en el directorio."
      />
      <PageShell className="pt-8">
        <MembershipCheckoutCard
          currentStatus={
            sub
              ? {
                  status: sub.status,
                  planCode: sub.planCode,
                  currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || null,
                  cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                  updatedAt: sub.updatedAt?.toISOString?.() || null,
                }
              : null
          }
          checkoutPaths={{
            successPath: "/mi-cuenta/coach/membresia?checkout=success",
            cancelPath: "/mi-cuenta/coach/membresia?checkout=cancel",
          }}
          pendingActivation={
            pendingActivation && pendingUntilEpochMs
              ? {
                  active: true,
                  pendingUntilEpochMs,
                  retryCheckoutHref: `/membresia/checkout?plan=${pendingPlanCode}`,
                  planCode: pendingPlanCode,
                }
              : null
          }
          checkoutStatus={checkoutStatus}
          showOnboardingCta={shouldShowOnboardingCta}
          onboardingStepSummary={onboardingStepSummary}
        />
      </PageShell>
    </>
  );
}
