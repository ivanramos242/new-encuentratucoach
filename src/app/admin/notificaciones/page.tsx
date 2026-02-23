import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { NotificationCenterView } from "@/components/v2/notification-center-view";
import { v2AdminActor } from "@/lib/v2-page-actors";
import { getJobsSnapshot, getJobRunLogs, listNotifications } from "@/lib/v2-service";

export default function AdminNotificationsPage() {
  const notifications = listNotifications(v2AdminActor);
  const jobs = getJobsSnapshot();
  const runLogs = getJobRunLogs().slice(0, 8);

  return (
    <>
      <PageHero
        badge="Admin · V2"
        title="Notificaciones y entregas"
        description="Monitoreo de notificaciones in-app y cola de emails (jobs) con reintentos/fallos."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <NotificationCenterView notifications={notifications} title="Notificaciones admin" />
          <div className="space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Jobs de email / sistema</h2>
              <div className="mt-4 grid gap-2">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm">
                    <p className="font-semibold text-zinc-900">{job.type}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {job.status} · prioridad {job.priority} · intentos {job.attempts}/{job.maxAttempts}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Ultimos runs</h2>
              <div className="mt-4 grid gap-2">
                {runLogs.length ? (
                  runLogs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm">
                      <p className="font-semibold text-zinc-900">{log.jobId}</p>
                      <p className="mt-1 text-xs text-zinc-600">{log.status} · {new Date(log.createdAt).toLocaleString("es-ES")}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-700">No hay ejecuciones registradas todavia.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}

