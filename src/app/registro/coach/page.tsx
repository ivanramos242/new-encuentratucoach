import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Registro de coach",
  description: "Crea una cuenta de coach para activar tu membresía y gestionar tu perfil.",
  path: "/registro/coach",
});

export default function CoachRegisterPage() {
  return (
    <PlaceholderPage
      badge="Auth V1"
      title="Crear cuenta de coach"
      description="Flujo de registro de coach con onboarding, membresía Stripe y perfil editable."
      routeType="Autenticación"
    />
  );
}
