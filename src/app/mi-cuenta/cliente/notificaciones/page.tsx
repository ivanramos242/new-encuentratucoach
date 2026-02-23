import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { NotificationCenterView } from "@/components/v2/notification-center-view";
import { v2ClientActor } from "@/lib/v2-page-actors";
import { listNotifications } from "@/lib/v2-service";

export default function ClientNotificationsPage() {
  const notifications = listNotifications(v2ClientActor);

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente · V2"
        title="Notificaciones"
        description="Avisos sobre respuestas del Q&A, mensajes de coaches y eventos de tu actividad dentro de la plataforma."
      />
      <PageShell className="pt-8">
        <div className="mb-5 flex justify-end">
          <Link
            href="/mi-cuenta/cliente/notificaciones/preferencias"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm"
          >
            Preferencias de notificacion
          </Link>
        </div>
        <NotificationCenterView notifications={notifications} title="Notificaciones del cliente" />
      </PageShell>
    </>
  );
}

