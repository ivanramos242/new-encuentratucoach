import { LoginCard } from "@/components/auth/auth-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Iniciar sesión",
  description: "Accede como coach o cliente a tu cuenta en la plataforma.",
  path: "/iniciar-sesion",
});

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const params = await searchParams;
  const returnToRaw = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = typeof returnToRaw === "string" && returnToRaw.startsWith("/") ? returnToRaw : "/mi-cuenta";

  return (
    <>
      <PageHero
        badge="Auth V3.0.1"
        title="Iniciar sesión"
        description="Accede a tu cuenta con sesión real (Prisma + cookies seguras) para coaches, clientes y admin."
      />
      <PageShell className="pt-8">
        <LoginCard returnTo={returnTo} />
      </PageShell>
    </>
  );
}

