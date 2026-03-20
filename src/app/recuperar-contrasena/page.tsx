import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Recuperar contraseña",
  description: "Recupera el acceso a tu cuenta por email.",
  path: "/recuperar-contrasena",
  noindex: true,
});

export default function ForgotPasswordPage() {
  return (
    <PlaceholderPage
      badge="Auth V1"
      title="Recuperar contraseña"
      description="Flujo preparado para solicitar reset de contraseña por email transaccional."
      routeType="Autenticación"
    />
  );
}
