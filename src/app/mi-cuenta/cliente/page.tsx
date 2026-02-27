import Link from "next/link";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowRight, faChartColumn, faEnvelope, faHeart, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CoachCard } from "@/components/directory/coach-card";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getUnreadMessagesTotalForUser } from "@/lib/conversation-service";
import { prisma } from "@/lib/prisma";
import { listPublicCoachesMerged } from "@/lib/public-coaches";

export default async function ClientDashboardPage() {
  const user = await requireRole(["client", "admin"], { returnTo: "/mi-cuenta/cliente" });
  const [pendingMessagesCount, favoriteRows, allPublicCoaches] = await Promise.all([
    getUnreadMessagesTotalForUser(user),
    prisma.coachFavorite.findMany({
      where: { userId: user.id },
      select: { coachProfileId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    listPublicCoachesMerged(),
  ]);
  const coachById = new Map(allPublicCoaches.map((coach) => [coach.id, coach]));
  const favoriteCoaches = favoriteRows
    .map((fav) => coachById.get(fav.coachProfileId))
    .filter((coach): coach is NonNullable<typeof coach> => Boolean(coach));

  const cards = [
    {
      href: "/mi-cuenta/cliente/mensajes",
      title: "Mensajes",
      desc: "Conversaciones con clientes y coaches.",
      icon: faEnvelope,
      accent: "from-rose-500 to-pink-500",
      cta: "Abrir mensajes",
      pending: pendingMessagesCount,
    },
    {
      href: "/pregunta-a-un-coach",
      title: "Pregunta a un coach",
      desc: "Crea preguntas públicas y sigue respuestas de la comunidad.",
      icon: faChartColumn,
      accent: "from-emerald-500 to-teal-500",
      cta: "Ir a preguntas",
    },
    {
      href: "/coaches",
      title: "Explorar coaches",
      desc: "Vuelve al directorio y descubre profesionales compatibles.",
      icon: faUsers,
      accent: "from-zinc-700 to-zinc-900",
      cta: "Explorar directorio",
    },
    {
      href: "#favoritos",
      title: "Favoritos",
      desc: "Tus coaches guardados para volver rápido cuando lo necesites.",
      icon: faHeart,
      accent: "from-rose-500 to-pink-500",
      cta: "Ver favoritos",
      pending: favoriteCoaches.length,
    },
  ] as const;

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente"
        title="Tu panel de cliente"
        description="Sigue tus conversaciones, notificaciones y reseñas desde un panel más completo."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6">
          <section className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
            <div className="grid gap-5 bg-[radial-gradient(circle_at_0%_0%,rgba(244,63,94,.14),transparent_42%),radial-gradient(circle_at_100%_10%,rgba(6,182,212,.12),transparent_40%)] p-6 lg:grid-cols-[1.15fr_.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-900">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Área privada de cliente
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
                  {user.displayName || "Tu cuenta"}
                </h2>
                <p className="mt-2 text-sm text-zinc-700">
                  Sesión activa como <strong>{user.role}</strong> con el email <strong>{user.email}</strong>.
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  Usa este panel para seguir conversaciones, gestionar avisos y revisar tus reseñas publicadas.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/mi-cuenta/cliente/mensajes"
                    className="inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 h-4 w-4" />
                    Mensajes
                    {pendingMessagesCount > 0 ? (
                      <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                        {pendingMessagesCount > 99 ? "99+" : pendingMessagesCount}
                      </span>
                    ) : null}
                  </Link>
                  <Link
                    href="/coaches"
                    className="inline-flex items-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    <FontAwesomeIcon icon={faUsers} className="mr-2 h-4 w-4 text-zinc-500" />
                    Explorar coaches
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <StatMiniCard label="Mensajes pendientes" value={String(pendingMessagesCount)} helper={pendingMessagesCount > 0 ? "Pendientes por leer" : "Sin pendientes"} />
                <StatMiniCard label="Acceso rápido" value="Mi cuenta" helper="Todo centralizado en este panel" />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => (
              <DashboardCard key={item.href} {...item} />
            ))}
          </section>

          <section id="favoritos" className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-950">Mis favoritos</h2>
                <p className="mt-1 text-sm text-zinc-700">Coaches guardados para comparar y contactar más tarde.</p>
              </div>
              <Link
                href="/coaches"
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Seguir explorando
              </Link>
            </div>

            {favoriteCoaches.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {favoriteCoaches.map((coach) => (
                  <CoachCard key={coach.id} coach={coach} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-4 text-sm text-zinc-700">
                Aún no tienes coaches guardados. Pulsa el icono de corazón en cualquier card o perfil para añadirlos.
              </div>
            )}
          </section>
        </div>
      </PageShell>
    </>
  );
}

function StatMiniCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-zinc-950">{value}</p>
      <p className="mt-1 text-xs text-zinc-600">{helper}</p>
    </div>
  );
}

function DashboardCard({
  href,
  title,
  desc,
  icon,
  accent,
  cta,
  pending,
}: {
  href: string;
  title: string;
  desc: string;
  icon: IconDefinition;
  accent: string;
  cta: string;
  pending?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-zinc-50 text-zinc-700">
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
        {pending && pending > 0 ? (
          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
            {pending > 99 ? "99+" : pending} pendientes
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-lg font-black tracking-tight text-zinc-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-700">{desc}</p>
      <div className="mt-4 inline-flex items-center text-sm font-semibold text-cyan-700 group-hover:text-cyan-800">
        {cta}
        <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3.5 w-3.5" />
      </div>
    </Link>
  );
}
