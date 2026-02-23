import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { getJobsSnapshot, getJobRunLogs } from "@/lib/v2-service";

export default function AdminJobsPage() {
  const jobs = getJobsSnapshot();
  const runLogs = getJobRunLogs();

  return (
    <>
      <PageHero
        badge="Admin · V2"
        title="Cola de jobs (web-only + cron)"
        description="Estado de la cola en Postgres para emails, recalculos y tareas diferidas, ejecutada por cron HTTP contra el servicio web."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Queue snapshot</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="pb-2 pr-4">Job</th>
                    <th className="pb-2 pr-4">Tipo</th>
                    <th className="pb-2 pr-4">Estado</th>
                    <th className="pb-2 pr-4">Prioridad</th>
                    <th className="pb-2">Intentos</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-t border-black/5">
                      <td className="py-2 pr-4 font-mono text-xs text-zinc-700">{job.id}</td>
                      <td className="py-2 pr-4">{job.type}</td>
                      <td className="py-2 pr-4">{job.status}</td>
                      <td className="py-2 pr-4">{job.priority}</td>
                      <td className="py-2">{job.attempts}/{job.maxAttempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Run logs</h2>
            <div className="mt-4 grid gap-2">
              {runLogs.length ? (
                runLogs.slice(0, 15).map((log) => (
                  <div key={log.id} className="rounded-xl border border-black/10 bg-zinc-50 p-3">
                    <p className="text-sm font-semibold text-zinc-900">{log.jobId}</p>
                    <p className="mt-1 text-xs text-zinc-600">{log.status} · {new Date(log.createdAt).toLocaleString("es-ES")}</p>
                    {log.errorMessage ? <p className="mt-1 text-xs text-red-700">{log.errorMessage}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-700">Sin ejecuciones todavía.</p>
              )}
            </div>
          </aside>
        </div>
      </PageShell>
    </>
  );
}

