import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { MessageInboxView } from "@/components/v2/message-inbox-view";
import { v2ClientActor } from "@/lib/v2-page-actors";
import { listThreadsForActor } from "@/lib/v2-service";

export default function ClientMessagesInboxPage() {
  const threads = listThreadsForActor(v2ClientActor);

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

