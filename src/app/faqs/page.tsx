import { JsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { faqItems } from "@/lib/mock-data";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQs",
  description: "Preguntas frecuentes sobre coaching en España, formatos, precios y certificación.",
  path: "/faqs",
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
        text: faq.answerHtml.replace(/<[^>]+>/g, " "),
      },
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero
        badge="FAQPage schema"
        title="Preguntas frecuentes sobre coaching"
        description="Respuestas claras para elegir coach con confianza y entender precios, formatos y certificación."
      />
      <PageShell className="pt-8">
        <div className="mx-auto grid max-w-4xl gap-3">
          {faqItems.map((faq) => (
            <details key={faq.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-base font-black tracking-tight text-zinc-950">{faq.question}</summary>
              <div className="prose-lite mt-3 text-zinc-700" dangerouslySetInnerHTML={{ __html: faq.answerHtml }} />
            </details>
          ))}
        </div>
      </PageShell>
    </>
  );
}
