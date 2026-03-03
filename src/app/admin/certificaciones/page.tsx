import Link from "next/link";
import { reviewAllPendingCertificationRequestsAction } from "@/app/admin/certificaciones/actions";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function parseCount(value: string | string[] | undefined) {
  if (typeof value !== "string") return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export default async function AdminCertificacionesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const [pendingRequests, approvedCount, rejectedCount, totalCount] = await Promise.all([
    prisma.certificationRequest.findMany({
      where: { status: "pending" },
      orderBy: { submittedAt: "asc" },
      select: {
        id: true,
        coachNotes: true,
        submittedAt: true,
        coachProfile: {
          select: {
            id: true,
            name: true,
            slug: true,
            certifiedStatus: true,
          },
        },
        coachUser: {
          select: {
            email: true,
            displayName: true,
          },
        },
        documents: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            storageKey: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.certificationRequest.count({ where: { status: "approved" } }),
    prisma.certificationRequest.count({ where: { status: "rejected" } }),
    prisma.certificationRequest.count(),
  ]);

  const pendingCount = pendingRequests.length;
  const bulk = typeof params.bulk === "string" ? params.bulk : "";
  const info = typeof params.info === "string" ? params.info : "";
  const error = typeof params.error === "string" ? params.error : "";
  const count = parseCount(params.count);

  return (
    <>
      <PageHero
        badge="Admin"
        title="Admin · Certificaciones"
        description="Revision documental de solicitudes de certificacion y acciones masivas de aprobacion o denegacion."
      />
      <PageShell className="pt-8">
        {bulk === "approved" ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Solicitudes aprobadas en bloque: {count}.
          </p>
        ) : null}
        {bulk === "rejected" ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            Solicitudes denegadas en bloque: {count}.
          </p>
        ) : null}
        {info === "no-pending" ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No hay solicitudes pendientes para revisar.
          </p>
        ) : null}
        {error === "invalid-decision" ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            Accion no valida. Vuelve a intentarlo desde el panel.
          </p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pendientes" value={String(pendingCount)} />
          <StatCard label="Aprobadas" value={String(approvedCount)} />
          <StatCard label="Rechazadas" value={String(rejectedCount)} />
          <StatCard label="Total solicitudes" value={String(totalCount)} />
        </section>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black tracking-tight text-zinc-950">Accion masiva</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Esta accion se aplica a todas las solicitudes <strong>pendientes</strong>. Se actualiza el estado de la
            solicitud, el distintivo del perfil y el log de revision.
          </p>

          <form action={reviewAllPendingCertificationRequestsAction} className="mt-4 grid gap-3">
            <label className="text-sm font-semibold text-zinc-900" htmlFor="bulk-note">
              Nota de revision (opcional)
            </label>
            <textarea
              id="bulk-note"
              name="note"
              rows={3}
              maxLength={1500}
              placeholder="Motivo comun para la decision masiva. Se guarda en las solicitudes revisadas."
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="decision"
                value="approved"
                disabled={pendingCount === 0}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aprobar todas las pendientes
              </button>
              <button
                type="submit"
                name="decision"
                value="rejected"
                disabled={pendingCount === 0}
                className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Denegar todas las pendientes
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Recomendado: revisa la tabla de pendientes antes de ejecutar la accion.
            </p>
          </form>
        </section>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-black tracking-tight text-zinc-950">Solicitudes pendientes</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Listado actual de solicitudes en espera, con documentos adjuntos y contexto para revision.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2">Solicitud</th>
                  <th className="px-3 py-2">Coach</th>
                  <th className="px-3 py-2">Documentos</th>
                  <th className="px-3 py-2">Notas</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => {
                  const coachEmail = request.coachUser.email || "-";
                  const coachName = request.coachProfile.name || request.coachUser.displayName || "Coach";
                  return (
                    <tr key={request.id} className="border-b border-black/5 align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-zinc-900">{request.id}</p>
                        <p className="mt-1 text-xs text-zinc-500">Enviada: {formatDate(request.submittedAt)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-zinc-900">{coachName}</p>
                        <p className="mt-1 text-xs text-zinc-600">{coachEmail}</p>
                        <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Distintivo actual: {request.coachProfile.certifiedStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {request.documents.length ? (
                          <ul className="space-y-2">
                            {request.documents.map((doc) => (
                              <li key={doc.id} className="rounded-lg border border-black/10 bg-zinc-50 px-2 py-1.5">
                                <p className="text-xs font-semibold text-zinc-900">{doc.fileName}</p>
                                <p className="text-xs text-zinc-600">
                                  {doc.mimeType} · {formatBytes(doc.sizeBytes)}
                                </p>
                                <p className="truncate text-[11px] text-zinc-500">{doc.storageKey}</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-zinc-500">Sin documentos</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-zinc-700">
                        {request.coachNotes ? (
                          <p className="max-w-[340px] whitespace-pre-wrap">{request.coachNotes}</p>
                        ) : (
                          <span className="text-xs text-zinc-500">Sin notas</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/coaches/${request.coachProfile.id}`}
                            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                          >
                            Abrir perfil admin
                          </Link>
                          {request.coachProfile.slug ? (
                            <Link
                              href={`/coaches/${request.coachProfile.slug}`}
                              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
                            >
                              Ver perfil publico
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!pendingRequests.length ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-sm text-zinc-600">
                      No hay solicitudes pendientes ahora mismo.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </PageShell>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-zinc-950">{value}</p>
    </div>
  );
}
