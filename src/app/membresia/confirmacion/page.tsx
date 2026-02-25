import { redirect } from "next/navigation";
import { MembershipConfirmationWaiter } from "@/components/coach/membership-confirmation-waiter";
import { PageShell } from "@/components/layout/page-shell";
import { getOptionalSessionUser } from "@/lib/auth-server";
import { buildMetadata } from "@/lib/seo";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Confirmacion de membresia",
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

  const checkout = Array.isArray(sp.checkout) ? sp.checkout[0] : sp.checkout;
  if (checkout === "cancel") redirect("/membresia?checkout=cancel");

  return (
    <PageShell className="pt-10">
      <MembershipConfirmationWaiter />
    </PageShell>
  );
}
