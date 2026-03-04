import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Qué es el coaching y para qué sirve",
  description:
    "Guía práctica para entender qué es el coaching, cuándo tiene sentido y cómo elegir un coach por especialidad y ciudad.",
  path: "/que-es-el-coaching-y-para-que-sirve",
  keywords: [
    "que es el coaching",
    "para que sirve el coaching",
    "coaching vs terapia",
    "como elegir coach",
    "coaching en españa",
  ],
});

export default function CoachingWhatIsGuidePage() {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "Qué es el coaching y para qué sirve", path: "/que-es-el-coaching-y-para-que-sirve" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <PageHero
        badge="Guía evergreen"
        title="Qué es el coaching y para qué sirve"
        description="Entiende el coaching sin ruido: cuándo aporta valor, qué esperar en sesiones y cómo elegir perfil según tu objetivo."
      />

      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Definición corta</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-700">
            El coaching es un proceso de acompañamiento orientado a objetivos concretos. No sustituye la terapia
            psicológica ni el asesoramiento médico; su foco está en claridad, plan de acción y seguimiento.
          </p>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Cuándo suele ayudar más</h2>
          <ul className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Transición profesional o cambio de rol</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Mejora de hábitos y productividad personal</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Liderazgo y gestión de equipos</li>
            <li className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2">Relaciones y toma de decisiones complejas</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Siguiente paso recomendado</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Si ya tienes tu objetivo definido, pasa a una landing transaccional y compara perfiles por encaje real.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/coaches" className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Ver directorio
            </Link>
            <Link href="/coaches/categoria/personal" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
              Coaching personal
            </Link>
            <Link href="/coaches/categoria/carrera" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
              Coaching de carrera
            </Link>
            <Link href="/coaches/categoria/liderazgo" className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
              Coaching de liderazgo
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}
