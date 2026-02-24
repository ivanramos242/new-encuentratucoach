import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";
import { getCoachProfileForEditor } from "@/lib/coach-profile-service";

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
  const profile = await getCoachProfileForEditor(user);
  const sub = profile?.subscriptions?.[0];
  const c = completion(profile);
  const hasActiveMembership = isActiveish(sub?.status);
  const needsOnboarding = hasActiveMembership && (profile?.profileStatus !== "published" || c.done < c.total);

  return (
    <>
      <PageHero
        badge="Mi cuenta · Coach"
        title="Panel de coach"
        description="Gestiona tu membresía, completa tu perfil y accede a mensajes, reseñas y métricas."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6">
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-zinc-950">
                  {profile?.name || user.displayName || "Tu perfil coach"}
                </h2>
                <p className="mt-2 text-sm text-zinc-700">
                  Estado perfil: <strong>{profile?.profileStatus || "draft"}</strong> · Visibilidad:{" "}
                  <strong>{profile?.visibilityStatus || "inactive"}</strong>
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  Membresía: <strong>{sub?.status || "sin suscripción"}</strong>
                  {sub?.planCode ? ` · ${sub.planCode}` : ""}
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">
                <p className="font-semibold">Progreso perfil</p>
                <p className="mt-1">
                  {c.done}/{c.total} pasos base completados
                </p>
              </div>
            </div>

            {!hasActiveMembership ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Activa tu membresía para publicar el perfil y responder en mensajes/Q&A.</p>
                <Link href="/mi-cuenta/coach/membresia" className="mt-3 inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-white">
                  Ir a membresía
                </Link>
              </div>
            ) : null}

            {needsOnboarding ? (
              <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
                <p className="font-semibold">Ya tienes una membresía activa. Completa el wizard para publicar tu perfil.</p>
                <Link
                  href="/mi-cuenta/coach/perfil?wizard=1"
                  className="mt-3 inline-flex rounded-xl border border-cyan-300 bg-white px-4 py-2 font-semibold text-zinc-900"
                >
                  Continuar wizard de perfil
                </Link>
              </div>
            ) : null}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { href: "/mi-cuenta/coach/perfil", title: "Perfil coach", desc: "Editar datos públicos, precios, enlaces y galería." },
              { href: "/mi-cuenta/coach/membresia", title: "Membresía", desc: "Estado de suscripción y facturación con Stripe." },
              { href: "/mi-cuenta/coach/mensajes", title: "Mensajes", desc: "Conversaciones con clientes (V2/V3)." },
              { href: "/mi-cuenta/coach/resenas", title: "Reseñas", desc: "Revisar y gestionar reseñas del perfil." },
              { href: "/mi-cuenta/coach/certificacion", title: "Certificación", desc: "Subir documentación y ver estado." },
              { href: "/mi-cuenta/coach/metricas", title: "Métricas", desc: "Visitas, retención y clics de tu perfil." },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
              >
                <h3 className="text-lg font-black tracking-tight text-zinc-950">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-700">{item.desc}</p>
              </Link>
            ))}
          </section>
        </div>
      </PageShell>
    </>
  );
}
