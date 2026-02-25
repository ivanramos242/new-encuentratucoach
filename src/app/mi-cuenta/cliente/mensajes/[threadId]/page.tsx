import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { MessagingShell } from "@/components/messages/messaging-shell";
import { requireRole } from "@/lib/auth-server";
import { getThreadForUser, listThreadsForUser } from "@/lib/conversation-service";

type ParamsInput = Promise<{ threadId: string }>;

export default async function ClientMessageThreadPage({ params }: { params: ParamsInput }) {
  const { threadId } = await params;
  const user = await requireRole(["client", "admin"], { returnTo: `/mi-cuenta/cliente/mensajes/${threadId}` });
  if (user.role !== "client") notFound();

  const [threadResult, listResult] = await Promise.all([
    getThreadForUser(threadId, user),
    listThreadsForUser(user),
  ]);
  if ("error" in threadResult) notFound();
  const threads = "error" in listResult ? [] : listResult.threads;

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente"
        title="Conversación"
        description="Chat privado con el coach, con estado de lectura, adjuntos y cola de envío anti-saturación."
      />
      <PageShell className="pt-8" containerClassName="max-w-[110rem]">
        <MessagingShell role="client" initialThreads={threads} initialThread={threadResult.thread} />
      </PageShell>
    </>
  );
}
