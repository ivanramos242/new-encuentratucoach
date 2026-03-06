import { HomeV4 } from "@/components/home/home-v4";
import { JsonLd } from "@/components/seo/json-ld";
import { listPublicCoachesMerged } from "@/lib/public-coaches";

const FAQ_ITEMS = [
  {
    question: "¿Cuánto cuesta una sesión de coaching en Madrid?",
    answer:
      "El rango habitual está entre 60 EUR y 150 EUR según especialidad, experiencia y modalidad. Puedes comparar precios y perfiles directamente en el directorio.",
  },
  {
    question: "¿Por dónde empiezo si busco coach en Barcelona?",
    answer:
      "Empieza por tu objetivo y modalidad preferida. En la ruta de Barcelona puedes comparar perfiles, reseñas y señales de encaje más rápido.",
  },
  {
    question: "¿Es mejor coach online o presencial?",
    answer:
      "Coach online ofrece más flexibilidad y oferta. Presencial puede encajar mejor si priorizas cercanía local. Lo ideal es elegir por objetivo y agenda.",
  },
] as const;

export async function HomePage() {
  const allPublicCoaches = await listPublicCoachesMerged();
  const latest = [...allPublicCoaches]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 12);

  const stats = {
    certifiedCount: allPublicCoaches.filter((coach) => coach.certifiedStatus === "approved").length,
    cityCount: new Set(allPublicCoaches.map((coach) => coach.citySlug)).size,
    publishedCount: allPublicCoaches.length,
    totalReviews: allPublicCoaches.reduce((sum, coach) => sum + coach.reviews.length, 0),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Buscar coach en España",
    url: "https://encuentratucoach.es/",
    description:
      "Directorio para encontrar coach en España, online o presencial. Compara perfiles por ciudad, especialidad, modalidad y presupuesto.",
    keywords:
      "buscar coach en España, directorio de coaches, coach online, coach presencial, coach por ciudad, coach por especialidad, encontrar coach, coaches certificados",
  };

  return (
    <>
      <JsonLd data={[faqSchema, webPageSchema]} />
      <HomeV4 coaches={latest} stats={stats} />
    </>
  );
}
