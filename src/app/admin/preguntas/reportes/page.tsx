import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { getQaReports } from "@/lib/v2-service";

export default function AdminQaReportsPage() {
  const reports = getQaReports();

  return (
    <>
      <PageHero
        badge="Admin · V2"
        title="Reportes de Q&A"
        description="Cola de reportes post-moderacion para preguntas y respuestas del modulo publico."
      />
      <PageShell className="pt-8">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="grid gap-3">
            {reports.length ? (
              reports.map((report) => (
                <article key={report.id} className="rounded-xl border border-black/10 bg-zinc-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900">
                      {report.targetType} · {report.targetId}
                    </p>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      {report.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-700">Motivo: {report.reason}</p>
                  {report.details ? <p className="mt-1 text-xs text-zinc-600">{report.details}</p> : null}
                  <p className="mt-2 text-xs text-zinc-500">Reporter: {report.reporterUserId} · {new Date(report.createdAt).toLocaleString("es-ES")}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-zinc-700">Todavia no hay reportes en el mock actual.</p>
            )}
          </div>
        </div>
      </PageShell>
    </>
  );
}

