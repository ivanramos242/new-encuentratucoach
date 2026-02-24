import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { MessageInboxView } from "@/components/v2/message-inbox-view";
import { getV2ClientPageActor } from "@/lib/v2-page-actors";
import { listThreadsForActor } from "@/lib/v2-service";

export default async function ClientMessagesInboxPage() {
  const actor = await getV2ClientPageActor();
  const threads = listThreadsForActor(actor);

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente · V2"
        title="Mensajes"
        description="Conversaciones con coaches desde perfiles o Q&A. Un hilo por coach, con historial y estado de lectura."
      />
      <PageShell className="pt-8">
        <MessageInboxView role="client" threads={threads} />
      </PageShell>
    </>
  );
}
