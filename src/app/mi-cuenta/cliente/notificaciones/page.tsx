import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { AccountNotificationCenter } from "@/components/notifications/account-notification-center";
import { requireRole } from "@/lib/auth-server";

export default async function ClientNotificationsPage() {
  await requireRole(["client", "admin"], { returnTo: "/mi-cuenta/cliente/notificaciones" });

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente"
        title="Notificaciones"
        description="Alertas in-app y emails sobre mensajes, pagos y novedades de la plataforma."
      />
      <PageShell className="pt-8">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-700">
              Puedes editar los avisos que quieres recibir desde{" "}
              <Link
                href="/mi-cuenta/cliente/notificaciones/preferencias"
                className="font-semibold text-cyan-700 hover:text-cyan-800"
              >
                preferencias de notificacion
              </Link>
              .
            </p>
          </div>
          <AccountNotificationCenter />
        </div>
      </PageShell>
    </>
  );
}

