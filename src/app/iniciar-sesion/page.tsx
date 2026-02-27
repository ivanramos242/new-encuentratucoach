<<<<<<< HEAD
﻿import { MockClientLoginCard } from "@/components/auth/mock-client-login-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
=======
import { LoginCard } from "@/components/auth/auth-card";
import { PageShell } from "@/components/layout/page-shell";
import { getInflatedRegisteredUsersCount } from "@/lib/platform-stats";
>>>>>>> 4647dc74b728c8703bf70842cb6a2588bce2ccac
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Iniciar sesion",
  description: "Accede como coach o cliente a tu cuenta en la plataforma.",
  path: "/iniciar-sesion",
});

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParamsInput }) {
<<<<<<< HEAD
  const raw = await searchParams;
  const returnToRaw = Array.isArray(raw.returnTo) ? raw.returnTo[0] : raw.returnTo;
  const returnTo = typeof returnToRaw === "string" ? returnToRaw : undefined;

  return (
    <>
      <PageHero
        badge="Auth V1"
        title="Iniciar sesion"
        description="Accede para guardar favoritos y gestionar tu cuenta de cliente o coach."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <MockClientLoginCard returnTo={returnTo} />
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Login completo (proximo sprint)</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Esta pantalla queda preparada para conectar email y contrasena con autenticacion real.
            </p>
          </div>
        </div>
      </PageShell>
    </>
=======
  const params = await searchParams;
  const returnToRaw = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = typeof returnToRaw === "string" && returnToRaw.startsWith("/") ? returnToRaw : "/mi-cuenta";
  const userCount = await getInflatedRegisteredUsersCount();

  return (
    <PageShell className="pt-8">
      <LoginCard returnTo={returnTo} userCount={userCount} />
    </PageShell>
>>>>>>> 4647dc74b728c8703bf70842cb6a2588bce2ccac
  );
}
