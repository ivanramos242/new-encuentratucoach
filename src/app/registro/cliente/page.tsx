import { RegisterCard } from "@/components/auth/auth-card";
import { PageShell } from "@/components/layout/page-shell";
import { getInflatedRegisteredUsersCount } from "@/lib/platform-stats";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Registro de cliente",
  description: "Crea una cuenta de cliente para resenar coaches y usar funciones de cuenta.",
  path: "/registro/cliente",
});

export default async function ClientRegisterPage() {
  const userCount = await getInflatedRegisteredUsersCount();

  return (
    <PageShell className="pt-8">
      <RegisterCard role="client" userCount={userCount} />
    </PageShell>
  );
}
