import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { requireRole } from "@/lib/auth-server";

export default async function ClientDashboardPage() {
  const user = await requireRole(["client", "admin"], { returnTo: "/mi-cuenta/cliente" });

  return (
    <>
      <PageHero
        badge="Mi cuenta · Cliente"
        title="Tu panel de cliente"
        description="Accede a tus mensajes, notificaciones y reseñas. Desde aquí podrás seguir tus conversaciones con coaches."
      />
      <PageShell className="pt-8">
        <div className="grid gap-6">
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Resumen de cuenta</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Sesión activa como <strong>{user.role}</strong> con el email <strong>{user.email}</strong>.
            </p>
            <p className="mt-1 text-sm text-zinc-700">
              Usa el panel para contactar con coaches, gestionar tus notificaciones y revisar tus reseñas publicadas.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { href: "/mi-cuenta/cliente/mensajes", title: "Mensajes", desc: "Ver tus conversaciones con coaches." },
              { href: "/mi-cuenta/cliente/notificaciones", title: "Notificaciones", desc: "Centro de notificaciones in-app." },
              {
                href: "/mi-cuenta/cliente/notificaciones/preferencias",
                title: "Preferencias",
                desc: "Controla qué avisos recibes por email o dentro de la plataforma.",
              },
              { href: "/mi-cuenta/cliente/resenas", title: "Mis reseñas", desc: "Gestiona reseñas que has enviado." },
              { href: "/pregunta-a-un-coach", title: "Pregunta a un coach", desc: "Crear preguntas públicas y seguir respuestas." },
              { href: "/coaches", title: "Explorar coaches", desc: "Volver al directorio para encontrar profesionales." },
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
