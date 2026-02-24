import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { MessageThreadView } from "@/components/v2/message-thread-view";
import { getV2CoachPageActor } from "@/lib/v2-page-actors";
import { getThreadForActor } from "@/lib/v2-service";

type ParamsInput = Promise<{ threadId: string }>;

export default async function CoachMessageThreadPage({ params }: { params: ParamsInput }) {
  const { threadId } = await params;
  const actor = await getV2CoachPageActor();
  const result = getThreadForActor(threadId, actor);
  if ("error" in result) notFound();

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach · V2"
        title="Detalle de conversacion"
        description="Vista del hilo con lectura, adjuntos y restriccion de respuesta si la membresia del coach esta inactiva."
      />
      <PageShell className="pt-8">
        <MessageThreadView role="coach" thread={result.thread} />
      </PageShell>
    </>
  );
}
