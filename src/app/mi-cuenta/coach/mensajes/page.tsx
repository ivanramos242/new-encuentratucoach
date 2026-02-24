import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { MessageInboxView } from "@/components/v2/message-inbox-view";
import { getV2CoachPageActor } from "@/lib/v2-page-actors";
import { listThreadsForActor } from "@/lib/v2-service";

export default async function CoachMessagesInboxPage() {
  const actor = await getV2CoachPageActor();
  const threads = listThreadsForActor(actor);

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
