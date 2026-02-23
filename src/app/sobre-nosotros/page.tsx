import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sobre nosotros",
  description: "Conoce el propósito de EncuentraTuCoach: conectar personas con coaches en España con foco en SEO y confianza.",
  path: "/sobre-nosotros",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        badge="Plataforma de directorio + SEO"
        title="Sobre EncuentraTuCoach"
        description="Creamos una plataforma para ayudar a personas a encontrar coaches y a coaches a conseguir visibilidad orgánica con un perfil profesional."
      />
      <PageShell className="pt-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Nuestra misión</h2>
            <p className="mt-3 leading-7 text-zinc-700">
              Facilitar el encuentro entre personas que buscan acompañamiento y coaches con una especialidad clara,
              filtros útiles y contenido que resuelva dudas reales desde buscadores.
            </p>
          </section>
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Qué cuidamos</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-700">
              <li>Perfiles claros por especialidad, ciudad y modalidad.</li>
              <li>Distintivo de certificación con revisión documental.</li>
              <li>SEO técnico y páginas útiles para atraer tráfico de calidad.</li>
              <li>Sin comisiones por contacto: modelo por membresía.</li>
            </ul>
          </section>
        </div>
      </PageShell>
    </>
  );
}
