import { MembershipCheckoutCard } from "@/components/coach/membership-checkout-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";

function isActiveish(status?: string | null) {
  return status === "active" || status === "trialing";
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
  const sub = profile?.subscriptions?.[0];
  const params = (await searchParams) || {};
  const checkoutStatus = typeof params.checkout === "string" ? params.checkout : undefined;
  const completion = getProfileCompletionSummary(profile);
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
                }
              : null
          }
          showOnboardingCta={shouldShowOnboardingCta}
          onboardingStepSummary={onboardingStepSummary}
        />
      </PageShell>
    </>
  );
}
