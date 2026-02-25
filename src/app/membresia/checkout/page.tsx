import { redirect } from "next/navigation";
import { MembershipCheckoutRedirect } from "@/components/coach/membership-checkout-redirect";
import { PageShell } from "@/components/layout/page-shell";
import { requireSessionUser } from "@/lib/auth-server";
import { buildMetadata } from "@/lib/seo";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

function pick(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

function isPlanCode(value: string | undefined): value is "monthly" | "annual" {
  return value === "monthly" || value === "annual";
}

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Procesando pago de membresía",
  description: "Preparando checkout de Stripe para activar tu cuenta coach.",
  path: "/membresia/checkout",
  noindex: true,
});

export default async function MembershipCheckoutPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const plan = pick(sp.plan);
  if (!isPlanCode(plan)) redirect("/membresia");

  const returnTo = `/membresia/checkout?plan=${encodeURIComponent(plan)}`;
  const user = await requireSessionUser({ returnTo });
  if (!(user.role === "client" || user.role === "coach" || user.role === "admin")) {
    redirect("/mi-cuenta");
  }

  return (
    <PageShell className="pt-10">
      <MembershipCheckoutRedirect planCode={plan} />
    </PageShell>
  );
}
