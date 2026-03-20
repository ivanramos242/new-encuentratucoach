import type { CoachProfile, FaqItem } from "@/types/domain";

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function countWordsFromChunks(chunks: Array<string | undefined | null>) {
  return chunks
    .filter(Boolean)
    .flatMap((chunk) => String(chunk).trim().split(/\s+/))
    .filter(Boolean).length;
}

export function buildCityCopy(cityName: string) {
  return [
    `Esta landing sirve para concentrar la demanda local de coach en ${cityName} sin depender de filtros con parametros.`,
    `La forma mas util de usarla es comparar perfiles reales, validar modalidad online o presencial y revisar si el rango de precio encaja antes de escribir.`,
    `Tambien funciona como puente hacia categorias concretas cuando la necesidad ya esta clara, por ejemplo coaching personal, liderazgo o bienestar en ${cityName}.`,
    `Si el numero de perfiles es bajo, la pagina debe seguir siendo util para usuario y buscador: explica el contexto local, enlaza a categorias relacionadas y evita competir con combinaciones filtradas poco estables.`,
    `El objetivo aqui no es llenar la URL de texto generico, sino ayudar a pasar de una busqueda amplia a dos o tres opciones plausibles.`,
  ];
}

export function buildCategoryCopy(categoryName: string) {
  return [
    `${categoryName} es una landing pensada para captar busquedas con intencion clara, sin depender de facetas con parametros ni de paginas antiguas del legado.`,
    `La propuesta de valor principal es ayudar a comparar perfiles reales por encaje, modalidad y precio antes de iniciar conversaciones.`,
    `Cuando una categoria tiene suficiente oferta, esta URL puede posicionar mejor que el directorio general porque responde a una necesidad mas concreta y reduce friccion en la decision.`,
    `Tambien evita canibalizacion con aliases antiguos y con posts informacionales que deberian reforzar la categoria en lugar de competir con ella.`,
    `Si el usuario aun no tiene del todo definida la necesidad, desde aqui puede bajar a una ciudad concreta o volver al directorio para abrir mas opciones.`,
  ];
}

export function buildCategoryCityCopy(categoryName: string, cityName: string) {
  return [
    `${categoryName} en ${cityName} funciona como landing de alta intencion: el usuario ya sabe que tipo de proceso busca y ademas quiere acotarlo por ciudad.`,
    `Eso obliga a que la pagina sea mas util que un simple listado: debe explicar que comparar, cuando conviene escribir y como decidir entre online o presencial.`,
    `Tambien es la mejor forma de evitar que combinaciones de filtros con parametros se indexen como duplicados del directorio.`,
    `Si la oferta es limitada, la URL sigue siendo valida para usuario porque permite ver rapidamente si hay encaje local real y, si no lo hay, saltar a la categoria general o al directorio.`,
  ];
}

export function getListingContentWordCount(input: {
  intro: string[];
  coaches: CoachProfile[];
  faqs?: FaqItem[];
  extras?: string[];
}) {
  return countWordsFromChunks([
    ...input.intro,
    ...(input.extras ?? []),
    ...input.coaches.flatMap((coach) => [
      coach.name,
      coach.headline,
      coach.bio,
      coach.specialties.join(" "),
      coach.pricingDetails.join(" "),
    ]),
    ...(input.faqs ?? []).flatMap((faq) => [faq.question, stripHtml(faq.answerHtml)]),
  ]);
}

export function getCategoryIntentLabel(categoryName: string) {
  return categoryName
    .replace(/^coaching\s+(de|para)\s+/i, "")
    .replace(/^coaching\s+/i, "")
    .trim()
    .toLowerCase();
}
