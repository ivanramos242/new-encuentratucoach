import { LoginCard } from "@/components/auth/auth-card";
import { PageShell } from "@/components/layout/page-shell";
import { getInflatedRegisteredUsersCount } from "@/lib/platform-stats";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Iniciar sesión",
  description: "Accede como coach o cliente a tu cuenta en la plataforma.",
  path: "/iniciar-sesion",
  noindex: true,
});

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const params = await searchParams;
  const returnToRaw = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = typeof returnToRaw === "string" && returnToRaw.startsWith("/") ? returnToRaw : "/mi-cuenta";
  const userCount = await getInflatedRegisteredUsersCount();

  return (
    <PageShell className="pt-8">
      <LoginCard returnTo={returnTo} userCount={userCount} />
    </PageShell>
  );
}
