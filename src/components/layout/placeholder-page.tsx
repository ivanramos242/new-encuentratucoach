import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";

export function PlaceholderPage({
  title,
  description,
  badge,
  routeType = "Pagina",
}: {
  title: string;
  description: string;
  badge?: string;
  routeType?: string;
}) {
  const isAdminRoute = routeType === "Administracion" || badge === "Admin";

  return (
    <>
      <PageHero title={title} description={description} badge={badge} />
      <PageShell className="pt-8">
        <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{routeType}</p>
              <p className="mt-3 text-zinc-700">
                Ruta preparada dentro del proyecto. En siguientes sprints se conecta con auth, Stripe, Prisma y
                logica de negocio.
              </p>
            </div>
            {isAdminRoute ? (
              <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[420px] lg:max-w-[460px]">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Estado</p>
                  <p className="mt-2 text-2xl font-black text-emerald-950">Estable</p>
                  <p className="mt-1 text-sm text-emerald-900/80">Base lista para conectar datos reales.</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Prioridad</p>
                  <p className="mt-2 text-2xl font-black text-sky-950">Operacion</p>
                  <p className="mt-1 text-sm text-sky-900/80">Validar flujos criticos antes de abrir trafico.</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Siguiente</p>
                  <p className="mt-2 text-2xl font-black text-amber-950">Datos</p>
                  <p className="mt-1 text-sm text-amber-900/80">Conectar metricas, estados y moderacion real.</p>
                </div>
              </div>
            ) : null}
          </div>

          {isAdminRoute ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="rounded-3xl border border-black/10 bg-zinc-950 p-5 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                      Centro de control
                    </p>
                    <p className="mt-2 text-xl font-black sm:text-2xl">Acciones rapidas para operar sin friccion</p>
                  </div>
                  <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    Admin
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/admin/coaches"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">Revisar coaches</p>
                    <p className="mt-1 text-sm text-white/70">Perfiles, visibilidad y calidad del directorio.</p>
                  </Link>
                  <Link
                    href="/admin/resenas"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">Moderacion de resenas</p>
                    <p className="mt-1 text-sm text-white/70">Controla confianza, reputacion y contenido sensible.</p>
                  </Link>
                  <Link
                    href="/admin/certificaciones"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">Validar certificaciones</p>
                    <p className="mt-1 text-sm text-white/70">Reduce fraude y mejora conversion por credibilidad.</p>
                  </Link>
                  <Link
                    href="/admin/blog"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">Contenido y SEO</p>
                    <p className="mt-1 text-sm text-white/70">Refuerza captacion organica con control editorial.</p>
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-black/10 bg-linear-to-br from-white to-zinc-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Checklist util</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <p className="text-sm font-semibold text-zinc-950">Permisos y accesos</p>
                    <p className="mt-1 text-sm text-zinc-600">Asegurar que solo admin vea estas rutas antes de lanzar.</p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <p className="text-sm font-semibold text-zinc-950">Estados vacios y errores</p>
                    <p className="mt-1 text-sm text-zinc-600">Importante para que el panel se sienta solido desde el dia uno.</p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <p className="text-sm font-semibold text-zinc-950">Metricas de negocio</p>
                    <p className="mt-1 text-sm text-zinc-600">Leads, coaches activos y conversiones deberian entrar aqui despues.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

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
