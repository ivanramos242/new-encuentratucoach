import { SubscriptionPlanDiscounts } from "@/components/admin/subscription-plan-discounts";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { listMembershipPlansForAdmin } from "@/lib/membership-plan-service";

export const dynamic = "force-dynamic";

export default async function AdminMembershipPage() {
  const plans = await listMembershipPlansForAdmin();

  return (
    <>
      <PageHero
        badge="Admin"
        title="Membresía y descuentos"
        description="Configura precios y descuentos temporales (con fecha de fin) para los planes mensual y anual."
      />
      <PageShell className="pt-8">
        <SubscriptionPlanDiscounts
          plans={plans.map((p) => ({
            ...p,
            discountEndsAt: p.discountEndsAt?.toISOString() || null,
          }))}
        />
      </PageShell>
    </>
  );
}

