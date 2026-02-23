import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { NotificationPreferencesView } from "@/components/v2/notification-preferences-view";
import { v2CoachActor } from "@/lib/v2-page-actors";
import { listNotificationPreferences } from "@/lib/v2-service";

export default function CoachNotificationPreferencesPage() {
  const preferences = listNotificationPreferences(v2CoachActor);

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach · V2"
        title="Preferencias de notificacion"
        description="Control por tipo y canal (in-app/email) para mensajes, Q&A y eventos de plataforma."
      />
      <PageShell className="pt-8">
        <NotificationPreferencesView preferences={preferences} actorLabel={v2CoachActor.displayName} />
      </PageShell>
    </>
  );
}

