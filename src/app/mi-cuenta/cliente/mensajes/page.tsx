import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { MessagingShell } from "@/components/messages/messaging-shell";
import { requireRole } from "@/lib/auth-server";
import { listThreadsForUser } from "@/lib/conversation-service";

export default async function ClientMessagesInboxPage() {
  const user = await requireRole(["client", "admin"], { returnTo: "/mi-cuenta/cliente/mensajes" });
  const result = user.role === "client" ? await listThreadsForUser(user) : null;
  const threads = result && !("error" in result) ? result.threads : [];

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente"
        title="Mensajes"
        description="Conversaciones con coaches en un chat privado con adjuntos, notas de audio (MVP) y polling adaptativo."
      />
      <PageShell className="pt-8" containerClassName="max-w-[110rem]">
        <MessagingShell role="client" initialThreads={threads} initialThread={null} />
      </PageShell>
    </>
  );
}
