import Link from "next/link";
import { faArrowRight, faChartColumn, faEnvelope, faEye, faGlobe, faMousePointer } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachPrivateAnalyticsSummary } from "@/lib/coach-profile-analytics";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";

export default async function Page() {
  const user = await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach/metricas" });
  const profile = await getCoachProfileForEditor(user);
  const stats = profile?.id ? await getCoachPrivateAnalyticsSummary(profile.id) : null;

  const profileHref = profile?.slug ? `/coaches/${profile.slug}#metricas-privadas` : null;

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Métricas del perfil"
        description="Accede al panel de analítica privada de tu perfil y revisa visitas, clics y tendencia."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6">
          <section className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
            <div className="grid gap-5 bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,.15),transparent_42%),radial-gradient(circle_at_100%_10%,rgba(6,182,212,.15),transparent_40%)] p-6 lg:grid-cols-[1.15fr_.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-900">
                  <FontAwesomeIcon icon={faChartColumn} className="h-3.5 w-3.5" />
                  Analítica privada
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
                  {profile?.name || "Tu perfil"}
                </h2>
                <p className="mt-2 text-sm text-zinc-700">
                  Este apartado ya enlaza a las métricas reales del perfil. El bloque completo se muestra dentro de tu ficha pública (solo visible para ti y admin).
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {profileHref ? (
                    <Link
                      href={profileHref}
                      className="inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                    >
                      <FontAwesomeIcon icon={faGlobe} className="mr-2 h-4 w-4" />
                      Abrir perfil con métricas
                    </Link>
                  ) : null}
                  <Link
                    href="/mi-cuenta/coach/perfil"
                    className="inline-flex items-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Editar perfil
                    <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3.5 w-3.5 text-zinc-500" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <MetricCard label="Visitas (30 días)" value={String(stats?.totals.last30Views ?? 0)} icon={faEye} />
                <MetricCard label="Clics (30 días)" value={String(stats?.totals.last30Clicks ?? 0)} icon={faMousePointer} />
                <MetricCard label="CTR aprox." value={`${stats?.totals.ctrPercent ?? 0}%`} icon={faEnvelope} />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black tracking-tight text-zinc-950">Dónde ver el detalle</h3>
            <p className="mt-2 text-sm text-zinc-700">
              El panel detallado (gráfico 14 días, tendencias y canales de clic) está integrado en la página pública del coach para que puedas validar cómo se ve tu perfil mientras revisas el rendimiento.
            </p>
            {profileHref ? (
              <Link
                href={profileHref}
                className="mt-4 inline-flex items-center rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-900 hover:bg-cyan-100"
              >
                Ir al bloque de métricas privadas del perfil
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-4 text-sm text-zinc-700">
                Aún no hay un perfil publicado con URL para enlazar. Completa o guarda tu perfil desde <strong>Perfil coach</strong>.
              </div>
            )}
          </section>
        </div>
      </PageShell>
    </>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: typeof faChartColumn;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <FontAwesomeIcon icon={icon} className="mr-2 h-3.5 w-3.5 text-zinc-500" />
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{value}</p>
    </div>
  );
}
