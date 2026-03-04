import Link from "next/link";
import { LandingSection } from "@/components/directory/landing-section";
import {
  buildAnonymizedReviewSnippets,
  buildPriceBandCopy,
  computeLandingMetrics,
  type LandingRealismKind,
} from "@/lib/landing-realism";
import type { CoachProfile } from "@/types/domain";

type Props = {
  kind: LandingRealismKind;
  items: CoachProfile[];
  city?: { slug: string; name: string };
  category?: { slug: string; name: string };
  priority: boolean;
};

function getScopeLabel(kind: LandingRealismKind, city?: { name: string }, category?: { name: string }) {
  if (kind === "city" && city) return `en ${city.name}`;
  if (kind === "category" && category) return `de ${category.name.toLowerCase()} en España`;
  if (kind === "category_city" && city && category) {
    return `de ${category.name.toLowerCase()} en ${city.name}`;
  }
  if (kind === "online") return "de coaching online";
  if (kind === "certified") return "de coaches certificados";
  return "de esta landing";
}

function getScopeTitle(kind: LandingRealismKind, city?: { name: string }, category?: { name: string }) {
  if (kind === "city" && city) return `Cómo interpretar la oferta real en ${city.name}`;
  if (kind === "category" && category) return `Qué esperar al buscar ${category.name.toLowerCase()}`;
  if (kind === "category_city" && city && category) return `${category.name} en ${city.name}: señales útiles antes de contactar`;
  if (kind === "online") return "Cómo evaluar una oferta online con criterio";
  if (kind === "certified") return "Qué aporta la certificación y cómo usarla bien";
  return "Cómo evaluar esta oferta con criterio";
}

function getPriorityTitle(kind: LandingRealismKind) {
  if (kind === "online") return "Rangos orientativos y qué esperar en sesiones online";
  if (kind === "certified") return "Rangos orientativos y qué esperar en perfiles certificados";
  return "Rangos orientativos y qué esperar";
}

function getMainCta(kind: LandingRealismKind, city?: { slug: string; name: string }, category?: { slug: string; name: string }) {
  if (kind === "city" && city) {
    return { href: `/coaches/ciudad/${city.slug}`, label: `Ver coaches en ${city.name}` };
  }
  if (kind === "category" && category) {
    return { href: `/coaches/categoria/${category.slug}`, label: `Ver ${category.name.toLowerCase()}` };
  }
  if (kind === "category_city" && city && category) {
    return {
      href: `/coaches/categoria/${category.slug}/${city.slug}`,
      label: `Ver ${category.name.toLowerCase()} en ${city.name}`,
    };
  }
  if (kind === "online") {
    return { href: "/coaches/modalidad/online", label: "Ver coaching online" };
  }
  if (kind === "certified") {
    return { href: "/coaches/certificados", label: "Ver coaches certificados" };
  }
  return { href: "/coaches", label: "Ver directorio" };
}

function getSecondaryCta(kind: LandingRealismKind, city?: { slug: string; name: string }, category?: { slug: string; name: string }) {
  if (kind === "city" && city) {
    return { href: `/coaches/categoria/personal/${city.slug}`, label: "Ver coaching personal en esta ciudad" };
  }
  if (kind === "category" && category) {
    return { href: "/coaches/certificados", label: "Filtrar perfiles certificados" };
  }
  if (kind === "category_city" && city && category) {
    return { href: `/coaches/categoria/${category.slug}`, label: `Ver ${category.name.toLowerCase()} en toda España` };
  }
  if (kind === "online") {
    return { href: "/coaches/certificados", label: "Comparar online certificados" };
  }
  return { href: "/coaches/modalidad/online", label: "Comparar con modalidad online" };
}

export function LandingRealisticContent({ kind, items, city, category, priority }: Props) {
  const metrics = computeLandingMetrics(items);
  const priceBand = buildPriceBandCopy(metrics);
  const reviews = buildAnonymizedReviewSnippets(items, 2);
  const scopeLabel = getScopeLabel(kind, city, category);
  const mainCta = getMainCta(kind, city, category);
  const secondaryCta = getSecondaryCta(kind, city, category);

  const hasStablePriceBand = metrics.priceSampleCount >= 3;

  return (
    <>
      <LandingSection
        title={getScopeTitle(kind, city, category)}
        description={`Lectura rápida basada en señales reales ${scopeLabel}: volumen, modalidad, precios y confianza para decidir con menos fricción.`}
      >
        <p className="mt-4 text-sm leading-6 text-zinc-700">
          Esta vista está pensada para ayudarte a separar ruido de señal útil. En vez de comparar perfiles a ciegas, puedes
          empezar por una referencia real de oferta activa, revisar cómo se reparte la modalidad de sesión y situar el precio
          en un rango orientativo. Después, lo más efectivo es contactar solo con 2 o 3 perfiles que encajen de verdad con
          tu objetivo.
        </p>

        <ul className="mt-4 grid gap-2 text-sm text-zinc-700">
          <li>
            <b>Oferta activa:</b> {metrics.coachCount} {metrics.coachCount === 1 ? "perfil publicado" : "perfiles publicados"} en este momento.
          </li>
          <li>
            <b>Modalidad:</b> {metrics.onlinePercent}% online y {metrics.presencialPercent}% presencial.
          </li>
          <li>
            <b>Precio orientativo:</b> {priceBand}
          </li>
          <li>
            <b>Señales de confianza:</b> {metrics.certifiedPercent}% con certificación aprobada y {metrics.reviewCount}{" "}
            {metrics.reviewCount === 1 ? "reseña visible" : "reseñas visibles"}.
          </li>
        </ul>
      </LandingSection>

      {priority ? (
        <LandingSection
          title={getPriorityTitle(kind)}
          description="Datos orientativos para tomar una decisión práctica, sin promesas ni expectativas irreales."
        >
          <p className="mt-4 text-sm leading-6 text-zinc-700">
            {hasStablePriceBand
              ? "Cuando hay suficiente muestra, la banda intermedia suele ser más útil que fijarte solo en el precio mínimo. Te ayuda a estimar qué nivel de experiencia, especialización o seguimiento vas a encontrar con mayor frecuencia."
              : "Con muestras pequeñas, lo más fiable es usar el rango publicado como referencia inicial y validar después metodología, experiencia y formato de trabajo en el primer contacto."}
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            {metrics.priceSampleCount > 0 && metrics.priceMedian != null
              ? `Referencia rápida: la mediana actual ronda ${new Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(metrics.priceMedian)} por sesión (orientativo).`
              : "Todavía no hay suficiente histórico para estimar una mediana robusta, así que conviene comparar propuestas concretas antes de decidir."}
          </p>

          <ul className="mt-4 grid gap-2 text-sm text-zinc-700">
            <li>
              <b>Escenario 1:</b> si buscas empezar rápido, prioriza perfiles con descripción de método clara y llamada a la
              acción directa.
            </li>
            <li>
              <b>Escenario 2:</b> si necesitas continuidad, valora formato de seguimiento y frecuencia propuesta, no solo el
              precio por sesión.
            </li>
            <li>
              <b>Escenario 3:</b> si dudas entre opciones similares, compara el encaje del enfoque con tu objetivo en lugar de
              elegir solo por coste.
            </li>
          </ul>
        </LandingSection>
      ) : null}

      {priority ? (
        <LandingSection
          title="Cómo decidir sin perder tiempo"
          description="Proceso breve para convertir esta búsqueda en una shortlist útil y accionable."
        >
          <ol className="mt-4 grid gap-2 text-sm text-zinc-700">
            <li>
              <b>1.</b> Define objetivo y horizonte temporal en una frase concreta.
            </li>
            <li>
              <b>2.</b> Elige 2 o 3 perfiles por encaje, no más, para evitar parálisis por comparación.
            </li>
            <li>
              <b>3.</b> Contacta con un mensaje breve indicando contexto, objetivo y disponibilidad.
            </li>
          </ol>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={mainCta.href}
              className="inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              {mainCta.label}
            </Link>
            <Link
              href={secondaryCta.href}
              className="inline-flex rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              {secondaryCta.label}
            </Link>
          </div>

          {reviews.length ? (
            <div className="mt-5">
              <h3 className="text-base font-black tracking-tight text-zinc-950">Experiencias de clientes (anonimizadas)</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {reviews.map((review, index) => (
                  <article key={`${review.body}-${index}`} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                    <p className="text-sm leading-6 text-zinc-700">“{review.body}”</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {review.author}
                      {review.cityLabel ? ` · ${review.cityLabel}` : ""}
                      {` · ${Math.max(1, Math.min(5, Math.round(review.rating)))}/5`}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </LandingSection>
      ) : null}
    </>
  );
}
