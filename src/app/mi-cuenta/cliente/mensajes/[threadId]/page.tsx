import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { MessageThreadView } from "@/components/v2/message-thread-view";
import { v2ClientActor } from "@/lib/v2-page-actors";
import { getThreadForActor } from "@/lib/v2-service";

type ParamsInput = Promise<{ threadId: string }>;

export default async function ClientMessageThreadPage({ params }: { params: ParamsInput }) {
  const { threadId } = await params;
  const result = getThreadForActor(threadId, v2ClientActor);
  if ("error" in result) notFound();

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente · V2"
        title="Detalle de conversacion"
        description="Hilo privado con coach y acciones de reporte/moderacion post-publicacion para incidencias."
      />
      <PageShell className="pt-8">
        <MessageThreadView role="client" thread={result.thread} />
      </PageShell>
    </>
  );
}

