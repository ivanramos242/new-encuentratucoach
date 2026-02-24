import { RegisterCard } from "@/components/auth/auth-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Registro de cliente",
  description: "Crea una cuenta de cliente para reseñar coaches y usar funciones de cuenta.",
  path: "/registro/cliente",
});

export default function ClientRegisterPage() {
  return (
    <>
      <PageHero
        badge="Auth V3.0.1"
        title="Crear cuenta de cliente"
        description="Registro real para reseñas, Q&A y mensajería interna."
      />
      <PageShell className="pt-8">
        <RegisterCard role="client" />
      </PageShell>
    </>
  );
}

