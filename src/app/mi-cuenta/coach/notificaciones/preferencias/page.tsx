import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { AccountNotificationPreferences } from "@/components/notifications/account-notification-preferences";
import { requireRole } from "@/lib/auth-server";

export default async function CoachNotificationPreferencesPage() {
  await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach/notificaciones/preferencias" });

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Preferencias de notificaciones"
        description="Configura que alertas quieres recibir por email o solo dentro de tu cuenta."
      />
      <PageShell className="pt-8">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-700">
              Cuando termines, puedes volver al{" "}
              <Link href="/mi-cuenta/coach/notificaciones" className="font-semibold text-cyan-700 hover:text-cyan-800">
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

