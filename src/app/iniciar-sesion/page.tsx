import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Iniciar sesión",
  description: "Accede como coach o cliente a tu cuenta en la plataforma.",
  path: "/iniciar-sesion",
});

export default function LoginPage() {
  return (
    <PlaceholderPage
      badge="Auth V1"
      title="Iniciar sesión"
      description="Página preparada para login por email y contraseña con recuperación de acceso."
      routeType="Autenticación"
    />
  );
}
