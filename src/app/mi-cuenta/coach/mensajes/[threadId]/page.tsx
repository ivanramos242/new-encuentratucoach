import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { MessagingShell } from "@/components/messages/messaging-shell";
import { requireRole } from "@/lib/auth-server";
import { getThreadForUser, listThreadsForUser } from "@/lib/conversation-service";

type ParamsInput = Promise<{ threadId: string }>;

export default async function CoachMessageThreadPage({ params }: { params: ParamsInput }) {
  const { threadId } = await params;
  const user = await requireRole(["coach", "admin"], { returnTo: `/mi-cuenta/coach/mensajes/${threadId}` });
  if (user.role !== "coach") notFound();

  const [threadResult, listResult] = await Promise.all([
    getThreadForUser(threadId, user),
    listThreadsForUser(user),
  ]);
  if ("error" in threadResult) notFound();
  const threads = "error" in listResult ? [] : listResult.threads;

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Conversación"
        description="Chat privado con clientes, lectura, adjuntos y cola de envío con control de carga del servidor."
      />
      <PageShell className="pt-8">
        <MessagingShell role="coach" initialThreads={threads} initialThread={threadResult.thread} />
      </PageShell>
    </>
  );
}

