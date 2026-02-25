import { RegisterCard } from "@/components/auth/auth-card";
import { PageShell } from "@/components/layout/page-shell";
import { getInflatedRegisteredUsersCount } from "@/lib/platform-stats";
import { buildMetadata } from "@/lib/seo";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

function pick(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Registro",
  description: "Crea tu cuenta para usar la plataforma. Si quieres publicar como coach, activaras la membresia despues.",
  path: "/registro",
});

export default async function RegisterPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await searchParams;
  const intent = pick(sp.intent) === "coach" ? "coach" : "client";
  const userCount = await getInflatedRegisteredUsersCount();

  return (
    <PageShell className="pt-8">
      <RegisterCard role={intent} userCount={userCount} />
    </PageShell>
  );
}
