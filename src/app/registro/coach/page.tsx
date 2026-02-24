import { RegisterCard } from "@/components/auth/auth-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Registro de coach",
  description: "Crea una cuenta de coach para activar tu membresía y gestionar tu perfil.",
  path: "/registro/coach",
});

export default function CoachRegisterPage() {
  return (
    <>
      <PageHero
        badge="Auth V3.0.1"
        title="Crear cuenta de coach"
        description="Registro real de coach con creación de usuario y perfil inicial en borrador."
      />
      <PageShell className="pt-8">
        <RegisterCard role="coach" />
      </PageShell>
    </>
  );
}

