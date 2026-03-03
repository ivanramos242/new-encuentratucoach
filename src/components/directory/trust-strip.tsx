import { faCircleCheck, faMessage, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { DirectoryTrustMetrics } from "@/lib/directory-trust-metrics";

function formatCount(value: number) {
  return new Intl.NumberFormat("es-ES").format(Math.max(0, Math.round(value)));
}

export function TrustStrip({ stats }: { stats: DirectoryTrustMetrics }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Confianza para decidir</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-zinc-950 sm:text-xl">Datos reales del directorio</h2>
        </div>
        <p className="text-xs text-zinc-600">Actualizado en la ventana de 7 dias</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricCard icon={faCircleCheck} label="Coaches verificados" value={formatCount(stats.verifiedCoaches)} />
        <MetricCard icon={faMessage} label="Contactos esta semana" value={formatCount(stats.contactsLast7d)} />
        <MetricCard icon={faStar} label="Reseñas reales" value={formatCount(stats.realReviews)} />
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: typeof faCircleCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{value}</p>
    </div>
  );
}
