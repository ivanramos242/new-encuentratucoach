import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { getConversationReports, listThreadsForActor } from "@/lib/v2-service";
import { v2AdminActor } from "@/lib/v2-page-actors";

export default function AdminMessagesPage() {
  const threads = listThreadsForActor(v2AdminActor);
  const reports = getConversationReports();

  return (
    <>
      <PageHero
        badge="Admin · V2"
        title="Supervision de mensajeria"
        description="Vista de incidencias y metadatos de hilos. La lectura de contenido por admin debe quedar justificada por incidente/auditoria."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Hilos recientes</h2>
            <div className="mt-4 grid gap-3">
              {threads.map((thread) => (
                <article key={thread.id} className="rounded-xl border border-black/10 bg-zinc-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900">{thread.clientName} ↔ {thread.coachName}</p>
                    <span className="text-xs text-zinc-500">{new Date(thread.lastMessageAt).toLocaleString("es-ES")}</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-600">
                    {thread.messages.length} mensajes · unread coach {thread.unreadForCoach} · unread client {thread.unreadForClient}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Membresia coach: {thread.coachMembershipActive ? "activa" : "inactiva"} · Estado: {thread.status}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Reportes de mensajeria</h2>
            <div className="mt-4 grid gap-3">
              {reports.length ? (
                reports.map((report) => (
                  <article key={report.id} className="rounded-xl border border-black/10 bg-zinc-50 p-4">
                    <p className="text-sm font-semibold text-zinc-900">Hilo {report.threadId}</p>
                    <p className="mt-1 text-xs text-zinc-600">Motivo: {report.reason}</p>
                    <p className="mt-1 text-xs text-zinc-500">Estado: {report.status}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-zinc-700">Sin reportes de mensajeria en el mock actual.</p>
              )}
            </div>
          </aside>
        </div>
      </PageShell>
    </>
  );
}

