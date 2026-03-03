import { AdminBroadcastForm } from "@/components/admin/admin-broadcast-form";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getJobRunLogs, getJobsSnapshot } from "@/lib/job-queue-service";
import { listNotificationsForUser } from "@/lib/notification-service";

export default async function AdminNotificationsPage() {
  const user = await requireRole("admin", { returnTo: "/admin/notificaciones" });
  const [notifications, jobs, runLogs] = await Promise.all([
    listNotificationsForUser(user.id, { limit: 30 }),
    getJobsSnapshot({ limit: 30 }),
    getJobRunLogs({ limit: 20 }),
  ]);

  return (
    <>
      <PageHero
        badge="Admin"
        title="Notificaciones y entregas"
        description="Monitoreo de alertas internas, envios email y comunicados segmentados o personalizados."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <section className="space-y-6">
            <AdminBroadcastForm />

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-black tracking-tight text-zinc-950">Alertas de administracion</h2>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                  {notifications.length} recientes
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {notifications.length ? (
                  notifications.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-xl border p-3 ${item.isRead ? "border-black/10 bg-zinc-50" : "border-cyan-200 bg-cyan-50"}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.type}</p>
                        <p className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleString("es-ES")}</p>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-zinc-900">{item.title}</p>
                      <p className="mt-1 text-sm text-zinc-700">{item.body}</p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-zinc-700">No hay alertas recientes para este admin.</p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Jobs de email / sistema</h2>
              <div className="mt-4 grid gap-2">
                {jobs.length ? (
                  jobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm">
                      <p className="font-semibold text-zinc-900">{job.type}</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {job.status} | prioridad {job.priority} | intentos {job.attempts}/{job.maxAttempts}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-700">No hay jobs activos.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Ultimos runs</h2>
              <div className="mt-4 grid gap-2">
                {runLogs.length ? (
                  runLogs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm">
                      <p className="font-semibold text-zinc-900">{log.jobId}</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {log.status} | {new Date(log.createdAt).toLocaleString("es-ES")}
                      </p>
                      {log.errorMessage ? <p className="mt-1 text-xs text-red-700">{log.errorMessage}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-700">No hay ejecuciones registradas todavia.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </PageShell>
    </>
  );
}

