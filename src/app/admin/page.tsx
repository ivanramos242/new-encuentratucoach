import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";

const cards = [
  {
    href: "/admin/membresia",
    title: "Membresía y descuentos",
    desc: "Gestiona precios y descuentos con fecha de fin para mostrar en los planes de coaches.",
  },
  {
    href: "/admin/coaches",
    title: "Coaches",
    desc: "Revisión y gestión de perfiles de coaches.",
  },
  {
    href: "/admin/preguntas",
    title: "Q&A",
    desc: "Moderación y supervisión de preguntas y respuestas.",
  },
  {
    href: "/admin/notificaciones",
    title: "Notificaciones",
    desc: "Cola y monitorización de entregas in-app y email.",
  },
  {
    href: "/admin/jobs",
    title: "Jobs",
    desc: "Ejecución y diagnóstico de jobs internos por cron.",
  },
  {
    href: "/admin/importaciones",
    title: "Importaciones",
    desc: "Sube un JSON de WordPress y ejecuta dry-run o importación de coaches desde la web.",
  },
] as const;

export default function AdminPage() {
  return (
    <>
      <PageHero
        badge="Admin"
        title="Panel de administración"
        description="Centro operativo para membresías, coaches, moderación y jobs internos."
      />
      <PageShell className="pt-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="text-lg font-black tracking-tight text-zinc-950">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-700">{card.desc}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-cyan-700">Abrir</span>
            </Link>
          ))}
        </div>
      </PageShell>
    </>
  );
}
