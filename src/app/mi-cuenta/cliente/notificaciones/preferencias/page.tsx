import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { NotificationPreferencesView } from "@/components/v2/notification-preferences-view";
import { v2ClientActor } from "@/lib/v2-page-actors";
import { listNotificationPreferences } from "@/lib/v2-service";

export default function ClientNotificationPreferencesPage() {
  const preferences = listNotificationPreferences(v2ClientActor);

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente · V2"
        title="Preferencias de notificacion"
        description="Gestiona avisos de respuestas, mensajes y cambios de estado relevantes para tu cuenta."
      />
      <PageShell className="pt-8">
        <NotificationPreferencesView preferences={preferences} actorLabel={v2ClientActor.displayName} />
      </PageShell>
    </>
  );
}

