import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { faqItems } from "@/lib/mock-data";
import { buildBreadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { sanitizeRichHtml } from "@/lib/html-sanitize";

const faqGroups = [
  {
    title: "Empezar con coaching",
    href: "/que-es-el-coaching-y-para-que-sirve",
    items: faqItems.slice(0, 2).map((faq) => faq.id),
  },
  {
    title: "Confianza y certificación",
    href: "/coaches/certificados",
    items: faqItems.slice(2, 3).map((faq) => faq.id),
  },
  {
    title: "Duración y decisión",
    href: "/como-elegir-coach-2026",
    items: faqItems.slice(3).map((faq) => faq.id),
  },
] as const;

export const metadata = buildMetadata({
  title: "FAQs",
  description: "Preguntas frecuentes sobre coaching en España, formatos, precios, duración y certificación.",
  path: "/faqs",
  keywords: [
    "faq coaching",
    "preguntas frecuentes coaching",
    "coaching españa dudas",
    "coach certificado",
    "precio coaching",
  ],
});

export default function FaqsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answerHtml.replace(/<[^>]+>/g, " ").trim(),
      },
    })),
  };
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Inicio", path: "/" },
    { name: "FAQs", path: "/faqs" },
  ]);

  return (
    <>
      <JsonLd data={[jsonLd, breadcrumb]} />
      <PageHero
        badge="FAQPage schema"
        title="Preguntas frecuentes sobre coaching"
        description="Respuestas claras para elegir coach con confianza y entender precios, formatos, duración y certificación."
      />
      <PageShell className="space-y-6 pt-8">
        <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-900">Atajos útiles</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {faqGroups.map((group) => (
              <Link key={group.title} href={group.href} className="rounded-2xl border border-cyan-200 bg-white p-4 hover:bg-cyan-100/40">
                <p className="text-sm font-black text-zinc-950">{group.title}</p>
                <p className="mt-2 text-sm text-zinc-700">Ir a la guía relacionada</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-4xl gap-4">
          {faqGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black tracking-tight text-zinc-950">{group.title}</h2>
                <Link href={group.href} className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Ver guía relacionada
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {faqItems
                  .filter((faq) => group.items.includes(faq.id))
                  .map((faq) => (
                    <details key={faq.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-5">
                      <summary className="cursor-pointer text-base font-black tracking-tight text-zinc-950">{faq.question}</summary>
                      <div
                        className="prose-lite mt-3 text-zinc-700"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(faq.answerHtml) }}
                      />
                    </details>
                  ))}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">Siguiente paso recomendado</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Si ya has resuelto tus dudas principales, compara perfiles reales y decide con señales de confianza visibles.
          </p>
          <div className="mt-4">
            <Link href="/coaches" className="inline-flex rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              Ver directorio de coaches
            </Link>
          </div>
        </section>
      </PageShell>
    </>
  );
}
