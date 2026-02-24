import { MembershipCheckoutCard } from "@/components/coach/membership-checkout-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";

export default async function CoachMembershipPage() {
  const user = await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach/membresia" });
  const profile = await getCoachProfileForEditor(user);
  const sub = profile?.subscriptions?.[0];

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
        />
      </PageShell>
    </>
  );
}

