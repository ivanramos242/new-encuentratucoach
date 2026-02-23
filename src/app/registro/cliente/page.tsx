import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Registro de cliente",
  description: "Crea una cuenta de cliente para reseñar coaches y usar futuras funciones de cuenta.",
  path: "/registro/cliente",
});

export default function ClientRegisterPage() {
  return (
    <PlaceholderPage
      badge="Auth V1"
      title="Crear cuenta de cliente"
      description="Flujo de registro de cliente preparado para reseñas, historial y futuras funciones de mensajería."
      routeType="Autenticación"
    />
  );
}
