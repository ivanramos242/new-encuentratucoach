import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { AccountNotificationPreferences } from "@/components/notifications/account-notification-preferences";
import { requireRole } from "@/lib/auth-server";

export default async function ClientNotificationPreferencesPage() {
  await requireRole(["client", "admin"], { returnTo: "/mi-cuenta/cliente/notificaciones/preferencias" });

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente"
        title="Preferencias de notificaciones"
        description="Elige que correos y avisos in-app quieres seguir recibiendo."
      />
      <PageShell className="pt-8">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-700">
              Puedes volver al{" "}
              <Link href="/mi-cuenta/cliente/notificaciones" className="font-semibold text-cyan-700 hover:text-cyan-800">
                centro de notificaciones
              </Link>
              .
            </p>
          </div>
          <AccountNotificationPreferences />
        </div>
      </PageShell>
    </>
  );
}

