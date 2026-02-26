import Link from "next/link";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRight,
  faChartColumn,
  faEnvelope,
  faListCheck,
  faPenToSquare,
  faStar,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";
import { getUnreadMessagesTotalForUser } from "@/lib/conversation-service";

function isActiveish(status?: string | null) {
  return status === "active" || status === "trialing";
}

function completion(profile: Awaited<ReturnType<typeof getCoachProfileForEditor>>) {
  const checks = [
    Boolean(profile?.name?.trim()),
    Boolean(profile?.bio?.trim()),
    Boolean(profile?.location?.city),
    Boolean(profile?.pricing?.basePriceEur),
    Boolean((profile?.sessionModes?.length || 0) > 0),
  ];
  const done = checks.filter(Boolean).length;
  return { done, total: checks.length };
}

export default async function CoachDashboardPage() {
  const user = await requireRole(["coach", "admin"], { returnTo: "/mi-cuenta/coach" });
  const [profile, pendingMessagesCount] = await Promise.all([
    getCoachProfileForEditor(user),
    getUnreadMessagesTotalForUser(user),
  ]);

  const sub = profile?.subscriptions?.[0];
  const c = completion(profile);
  const hasActiveMembership = isActiveish(sub?.status);
  const needsOnboarding = hasActiveMembership && (profile?.profileStatus !== "published" || c.done < c.total);

  const cards = [
    {
      href: "/mi-cuenta/coach/perfil",
      title: "Perfil coach",
      desc: "Editar datos públicos, precios, enlaces y galería.",
      icon: faPenToSquare,
      accent: "from-cyan-500 to-sky-500",
      cta: "Editar perfil",
    },
    {
      href: "/mi-cuenta/coach/membresia",
      title: "Membresía",
      desc: "Estado de suscripción, plan actual y facturación.",
      icon: faStar,
      accent: "from-amber-500 to-orange-500",
      cta: "Ver membresía",
      badge: sub?.status ? String(sub.status) : "sin suscripción",
    },
    {
      href: "/mi-cuenta/coach/mensajes",
      title: "Mensajes",
      desc: "Conversaciones con clientes y coaches.",
      icon: faEnvelope,
      accent: "from-rose-500 to-pink-500",
      cta: "Abrir bandeja",
      pending: pendingMessagesCount,
    },
    {
      href: "/mi-cuenta/coach/certificacion",
      title: "Certificación",
      desc: "Subir documentación y revisar estado de validación.",
      icon: faUser,
      accent: "from-violet-500 to-fuchsia-500",
      cta: "Gestionar certificación",
    },
    {
      href: "/mi-cuenta/coach/metricas",
      title: "Métricas",
      desc: "Visitas, retención y clics de tu perfil.",
      icon: faChartColumn,
      accent: "from-emerald-500 to-teal-500",
      cta: "Ver métricas",
    },
    {
      href: "/coaches",
      title: "Ver directorio",
      desc: "Revisa cómo se muestran otros perfiles y detecta mejoras.",
      icon: faUsers,
      accent: "from-zinc-700 to-zinc-900",
      cta: "Explorar",
    },
  ] as const;

  const completionPct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Panel profesional"
        description="Gestiona tu perfil, membresía, mensajes y métricas desde un panel más completo."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6">
          <section className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
            <div className="grid gap-5 bg-[radial-gradient(circle_at_15%_0%,rgba(6,182,212,.16),transparent_42%),radial-gradient(circle_at_100%_20%,rgba(16,185,129,.14),transparent_38%)] p-6 lg:grid-cols-[1.2fr_.8fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-900">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  Área privada de coach
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
                  {profile?.name || user.displayName || "Tu perfil coach"}
                </h2>
                <p className="mt-2 text-sm text-zinc-700">
                  Estado perfil: <strong>{profile?.profileStatus || "draft"}</strong> · Visibilidad: <strong>{profile?.visibilityStatus || "inactive"}</strong>
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  Membresía: <strong>{sub?.status || "sin suscripción"}</strong>
                  {sub?.planCode ? ` · ${sub.planCode}` : ""}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/mi-cuenta/coach/perfil"
                    className="inline-flex items-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="mr-2 h-4 w-4 text-zinc-500" />
                    Editar perfil
                  </Link>
                  <Link
                    href="/mi-cuenta/coach/mensajes"
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
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <StatMiniCard label="Progreso del perfil" value={`${c.done}/${c.total}`} helper={`${completionPct}% completado`} />
                <StatMiniCard label="Mensajes pendientes" value={String(pendingMessagesCount)} helper={pendingMessagesCount > 0 ? "Pendientes por leer" : "Bandeja al día"} />
              </div>
            </div>

            <div className="border-t border-black/5 bg-zinc-50/70 p-4 sm:p-5">
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                  style={{ width: `${Math.max(8, completionPct)}%` }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-xs font-medium text-zinc-600">
                Completa los datos base para publicar y mejorar la conversión del perfil.
              </p>
            </div>
          </section>

          {!hasActiveMembership ? (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
              <p className="font-semibold">Activa tu membresía para publicar el perfil y responder en mensajes/Q&A.</p>
              <Link href="/mi-cuenta/coach/membresia" className="mt-3 inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2 font-semibold text-white">
                <FontAwesomeIcon icon={faArrowRight} className="mr-2 h-3.5 w-3.5" />
                Ir a membresía
              </Link>
            </section>
          ) : null}

          {needsOnboarding ? (
            <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 text-sm text-cyan-900 shadow-sm">
              <p className="font-semibold">Ya tienes una membresía activa. Completa el formulario para publicar tu perfil.</p>
              <Link
                href="/mi-cuenta/coach/perfil?wizard=1"
                className="mt-3 inline-flex items-center rounded-xl border border-cyan-300 bg-white px-4 py-2 font-semibold text-zinc-900"
              >
                <FontAwesomeIcon icon={faListCheck} className="mr-2 h-3.5 w-3.5 text-cyan-700" />
                Continuar formulario de bienvenida
              </Link>
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => (
              <DashboardCard key={item.href} {...item} />
            ))}
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
  badge,
  pending,
}: {
  href: string;
  title: string;
  desc: string;
  icon: IconDefinition;
  accent: string;
  cta: string;
  badge?: string;
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
        ) : badge ? (
          <span className="inline-flex items-center rounded-full border border-black/10 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700">
            {badge}
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
