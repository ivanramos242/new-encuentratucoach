import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { NotificationPreferencesView } from "@/components/v2/notification-preferences-view";
import { getV2ClientPageActor } from "@/lib/v2-page-actors";
import { listNotificationPreferences } from "@/lib/v2-service";

export default async function ClientNotificationPreferencesPage() {
  const actor = await getV2ClientPageActor();
  const preferences = listNotificationPreferences(actor);

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente · V2"
        title="Preferencias de notificacion"
        description="Gestiona avisos de respuestas, mensajes y cambios de estado relevantes para tu cuenta."
      />
      <PageShell className="pt-8">
        <NotificationPreferencesView preferences={preferences} actorLabel={actor.displayName} />
      </PageShell>
    </>
  );
}
