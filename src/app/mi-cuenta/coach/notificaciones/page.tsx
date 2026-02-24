import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { NotificationCenterView } from "@/components/v2/notification-center-view";
import { getV2CoachPageActor } from "@/lib/v2-page-actors";
import { listNotifications } from "@/lib/v2-service";

export default async function CoachNotificationsPage() {
  const actor = await getV2CoachPageActor();
  const notifications = listNotifications(actor);

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach · V2"
        title="Notificaciones"
        description="Centro in-app de mensajes, Q&A y eventos de plataforma con cola de emails casi inmediata."
      />
      <PageShell className="pt-8">
        <div className="mb-5 flex justify-end">
          <Link
            href="/mi-cuenta/coach/notificaciones/preferencias"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm"
          >
            Preferencias de notificacion
          </Link>
        </div>
        <NotificationCenterView notifications={notifications} title="Notificaciones del coach" />
      </PageShell>
    </>
  );
}
