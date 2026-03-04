import { HomeV4 } from "@/components/home/home-v4";
import { JsonLd } from "@/components/seo/json-ld";
import { listPublicCoachesMerged } from "@/lib/public-coaches";

const FAQ_ITEMS = [
  {
    question: "Cuanto cuesta una sesion de coaching en Madrid?",
    answer:
      "El rango habitual esta entre 60 EUR y 150 EUR segun especialidad, experiencia y modalidad. Puedes comparar coach madrid precio directamente en el directorio.",
  },
  {
    question: "Busco coach barcelona: por donde empiezo?",
    answer:
      "Empieza por objetivo y modalidad. En la ruta de Barcelona puedes comparar perfiles, resenas y disponibilidad para decidir mas rapido.",
  },
  {
    question: "Como encontrar coach profesional en Madrid sin perder tiempo?",
    answer:
      "Define tu objetivo en una frase, revisa especialidad y certificacion, y contacta 2 o 3 perfiles con un mensaje claro sobre tu caso.",
  },
  {
    question: "Es mejor coach online o presencial?",
    answer:
      "Coach online ofrece flexibilidad y mas oferta; presencial puede ser mejor si priorizas cercania. Lo ideal es elegir por objetivo y agenda.",
  },
];

export async function HomePage() {
  const latest = [...(await listPublicCoachesMerged())]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 12);

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
      "Directorio para encontrar coach en Espana, online o presencial. Compara perfiles por ciudad, especialidad, modalidad y presupuesto.",
    keywords:
      "buscar coach en espana, directorio de coaches, coach online, coach presencial, coach por ciudad, coach por especialidad, encontrar coach, coaches certificados",
  };

  return (
    <>
      <JsonLd data={[faqSchema, webPageSchema]} />
      <HomeV4 coaches={latest} />
    </>
  );
}
