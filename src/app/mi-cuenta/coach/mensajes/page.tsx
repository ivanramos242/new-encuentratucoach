import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { MessagingShell } from "@/components/messages/messaging-shell";
import { requireRole } from "@/lib/auth-server";
import { listThreadsForUser } from "@/lib/conversation-service";

export default async function CoachMessagesInboxPage() {
  const user = await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach/mensajes" });
  const result = user.role === "coach" ? await listThreadsForUser(user) : null;
  const threads = result && !("error" in result) ? result.threads : [];

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Mensajes"
        description="Inbox interno estilo chat con clientes, adjuntos e intervalos de polling adaptativos para no saturar el servidor."
      />
      <PageShell className="pt-8">
        <MessagingShell role="coach" initialThreads={threads} initialThread={null} />
      </PageShell>
    </>
  );
}

