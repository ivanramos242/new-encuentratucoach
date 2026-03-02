import Link from "next/link";
import { SiteContactForm } from "@/components/forms/site-contact-form";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";

const CONTACT_FAQ = [
  {
    q: "¿Cómo contacto con el equipo de EncuentraTuCoach?",
    a: "Puedes escribir por email a info@encuentratucoach.es o usar esta página de contacto para dejar tu mensaje.",
  },
  {
    q: "¿Qué información debo incluir en un reporte técnico?",
    a: "Incluye URL, pasos para reproducir, resultado esperado, resultado real y captura si aplica.",
  },
  {
    q: "¿Puedo resolver dudas sobre membresía desde esta página?",
    a: "Sí. Selecciona el motivo correcto en el formulario y el equipo te orientará sobre planes, pagos y activación.",
  },
  {
    q: "¿Este canal sirve para dudas sobre un coach específico?",
    a: "Sí. Comparte el enlace del perfil y el contexto de tu consulta para una respuesta más rápida.",
  },
] as const;

export const metadata = buildMetadata({
  title: "Contacto EncuentraTuCoach",
  description:
    "Contacta con EncuentraTuCoach para soporte, membresía, certificaciones y dudas sobre el directorio de coaches en España.",
  path: "/contacto",
  keywords: [
    "contacto encuentratucoach",
    "soporte coaches españa",
    "ayuda membresía coaches",
    "contactar directorio de coaches",
  ],
});

export default function ContactPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: CONTACT_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EncuentraTuCoach",
    url: "https://encuentratucoach.es/",
    email: "info@encuentratucoach.es",
  };

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contacto | EncuentraTuCoach",
    url: "https://encuentratucoach.es/contacto",
    inLanguage: "es",
  };

  return (
    <>
      <JsonLd data={[faqSchema, organizationSchema, contactPageSchema]} />
      <PageHero
        badge="Soporte y contacto"
        title="Contacta con EncuentraTuCoach"
        description="Canal para soporte técnico, dudas de membresía, certificación y consultas generales sobre la plataforma."
      />
      <PageShell className="space-y-6 pt-8">
        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black tracking-tight text-zinc-950">Email</h2>
            <p className="mt-2 text-sm text-zinc-700">Canal principal para soporte y colaboraciones.</p>
            <a
              href="mailto:info@encuentratucoach.es"
              className="mt-4 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              info@encuentratucoach.es
            </a>
          </article>
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black tracking-tight text-zinc-950">Membresía para coaches</h2>
            <p className="mt-2 text-sm text-zinc-700">Planes, activación, cambios y estado de cuenta.</p>
            <Link
              href="/membresia"
              className="mt-4 inline-flex rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Ver membresía
            </Link>
          </article>
          <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black tracking-tight text-zinc-950">Chat en vivo</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Si tienes Crisp activo, usa el botón azul de chat en la esquina inferior derecha para una respuesta rápida.
            </p>
            <p className="mt-4 rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700">
              Ideal para consultas breves.
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <SiteContactForm />

          <aside className="space-y-4">
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Checklist para soporte técnico</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                <li>Página donde ocurre el problema.</li>
                <li>Pasos exactos para reproducir.</li>
                <li>Resultado esperado vs resultado real.</li>
                <li>Captura si hay error visible.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Enlaces útiles</h2>
              <div className="mt-3 grid gap-2">
                <Link href="/faqs" className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
                  Ver FAQ general
                </Link>
                <Link href="/pregunta-a-un-coach" className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
                  Pregunta a un coach
                </Link>
                <Link href="/coaches" className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
                  Ir al directorio
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Preguntas frecuentes</h2>
          <div className="mt-4 grid gap-3">
            {CONTACT_FAQ.map((item) => (
              <details key={item.q} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                <summary className="cursor-pointer font-semibold text-zinc-900">{item.q}</summary>
                <p className="mt-2 text-sm text-zinc-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </PageShell>
    </>
  );
}
