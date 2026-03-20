import { MockClientLoginCard } from "@/components/auth/mock-client-login-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
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
  const raw = await searchParams;
  const returnToRaw = Array.isArray(raw.returnTo) ? raw.returnTo[0] : raw.returnTo;
  const returnTo = typeof returnToRaw === "string" && returnToRaw.startsWith("/") ? returnToRaw : undefined;

  return (
    <>
      <PageHero
        badge="Acceso cliente demo"
        title="Iniciar sesión"
        description="Accede para guardar favoritos y gestionar tu cuenta de cliente o coach."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <MockClientLoginCard returnTo={returnTo} />
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Acceso completo</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Esta pantalla queda preparada para conectar autenticación real sin exponerla a indexación.
            </p>
          </div>
        </div>
      </PageShell>
    </>
  );
}
