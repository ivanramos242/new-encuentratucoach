import { redirect } from "next/navigation";
import { MembershipConfirmationWaiter } from "@/components/coach/membership-confirmation-waiter";
import { PageShell } from "@/components/layout/page-shell";
import { getOptionalSessionUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;
const PENDING_ACTIVATION_WINDOW_MS = 3 * 60 * 1000;

function pick(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

function isPlanCode(value: string | undefined): value is "monthly" | "annual" {
  return value === "monthly" || value === "annual";
}

function isRecentPendingActivation(status?: string | null, updatedAt?: Date | null) {
  if (status !== "incomplete" || !updatedAt) return false;
  const ageMs = Date.now() - updatedAt.getTime();
  return ageMs >= 0 && ageMs < PENDING_ACTIVATION_WINDOW_MS;
}

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Confirmación de membresía",
  description: "Procesando el pago y activando tu cuenta coach.",
  path: "/membresia/confirmacion",
  noindex: true,
});

export default async function MembershipConfirmationPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const sessionUser = await getOptionalSessionUser();

  if (!sessionUser) {
    redirect(`/iniciar-sesion?returnTo=${encodeURIComponent("/membresia/confirmacion")}`);
  }

  if (sessionUser.role === "coach" || sessionUser.role === "admin") {
    redirect("/mi-cuenta/coach/membresia?checkout=success");
  }

  const checkout = pick(sp.checkout);
  const requestedPlan = pick(sp.plan);
  if (checkout === "cancel") redirect("/membresia?checkout=cancel");

  const coachProfile = await prisma.coachProfile.findFirst({
    where: {
      OR: [{ userId: sessionUser.id }, ...(sessionUser.coachProfileId ? [{ id: sessionUser.coachProfileId }] : [])],
    },
    orderBy: { createdAt: "asc" },
    select: {
      subscriptions: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { status: true, updatedAt: true, planCode: true },
      },
    },
  });
  const latestSubscription = coachProfile?.subscriptions?.[0];
  const hasRecentPending = isRecentPendingActivation(latestSubscription?.status, latestSubscription?.updatedAt);

  if (!hasRecentPending) {
    redirect("/membresia");
  }

  const planCode = isPlanCode(requestedPlan) ? requestedPlan : latestSubscription?.planCode;
  const retryPaymentHref = planCode ? `/membresia/checkout?plan=${planCode}` : "/membresia";
  const pendingUntilEpochMs = latestSubscription!.updatedAt!.getTime() + PENDING_ACTIVATION_WINDOW_MS;

  return (
    <PageShell className="pt-10">
      <MembershipConfirmationWaiter retryPaymentHref={retryPaymentHref} pendingUntilEpochMs={pendingUntilEpochMs} />
    </PageShell>
  );
}
