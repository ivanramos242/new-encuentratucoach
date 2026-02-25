import { RegisterCard } from "@/components/auth/auth-card";
import { PageShell } from "@/components/layout/page-shell";
import { getInflatedRegisteredUsersCount } from "@/lib/platform-stats";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Registro de coach",
  description: "Crea tu cuenta unica y activa la membresia para habilitar tu perfil coach.",
  path: "/registro/coach",
});

export default async function CoachRegisterPage() {
  const userCount = await getInflatedRegisteredUsersCount();

  return (
    <PageShell className="pt-8">
      <RegisterCard role="coach" userCount={userCount} />
    </PageShell>
  );
}
