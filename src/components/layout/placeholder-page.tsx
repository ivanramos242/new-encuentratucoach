import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";

export function PlaceholderPage({
  title,
  description,
  badge,
  routeType = "Página",
}: {
  title: string;
  description: string;
  badge?: string;
  routeType?: string;
}) {
  return (
    <>
      <PageHero title={title} description={description} badge={badge} />
      <PageShell className="pt-8">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{routeType}</p>
          <p className="mt-3 text-zinc-700">
            Ruta preparada dentro del proyecto. En siguientes sprints se conecta con auth, Stripe, Prisma y lógica de
            negocio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Volver al inicio
            </Link>
            <Link
              href="/coaches"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Ver directorio
            </Link>
          </div>
        </div>
      </PageShell>
    </>
  );
}
