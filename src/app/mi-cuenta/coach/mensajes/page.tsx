import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { MessageInboxView } from "@/components/v2/message-inbox-view";
import { v2CoachActor } from "@/lib/v2-page-actors";
import { listThreadsForActor } from "@/lib/v2-service";

export default function CoachMessagesInboxPage() {
  const threads = listThreadsForActor(v2CoachActor);

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach · V2"
        title="Mensajes"
        description="Inbox interno cliente -> coach con hilo unico por cliente+coach, polling cada 5 minutos y adjuntos (imagen/PDF, 5 MB max)."
      />
      <PageShell className="pt-8">
        <MessageInboxView role="coach" threads={threads} />
      </PageShell>
    </>
  );
}

