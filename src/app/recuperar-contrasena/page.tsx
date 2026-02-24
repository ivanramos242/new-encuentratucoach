import { ForgotPasswordCard, ResetPasswordCard } from "@/components/auth/auth-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Recuperar contraseña",
  description: "Recupera el acceso a tu cuenta por email.",
  path: "/recuperar-contrasena",
});

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const params = await searchParams;
  const tokenRaw = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = typeof tokenRaw === "string" ? tokenRaw : "";

  return (
    <>
      <PageHero
        badge="Auth V3.0.1"
        title={token ? "Restablecer contraseña" : "Recuperar contraseña"}
        description={token ? "Completa el cambio de contraseña con tu token de recuperación." : "Solicita un enlace de recuperación por email."}
      />
      <PageShell className="pt-8">{token ? <ResetPasswordCard token={token} /> : <ForgotPasswordCard />}</PageShell>
    </>
  );
}

