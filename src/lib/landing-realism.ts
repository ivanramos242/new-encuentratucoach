import { formatEuro } from "@/lib/utils";
import type { CoachProfile } from "@/types/domain";

export type LandingRealismKind = "city" | "category" | "category_city" | "online" | "certified";

export type LandingMetrics = {
  coachCount: number;
  priceSampleCount: number;
  priceMin: number | null;
  priceMax: number | null;
  priceMedian: number | null;
  priceP25: number | null;
  priceP75: number | null;
  onlinePercent: number;
  presencialPercent: number;
  certifiedPercent: number;
  reviewCount: number;
};

export type AnonymizedReviewSnippet = {
  author: string;
  rating: number;
  body: string;
  cityLabel?: string;
};

export type PriorityLandingInput = {
  kind: LandingRealismKind;
  allCoaches: CoachProfile[];
  categorySlug?: string | null;
  citySlug?: string | null;
};

export type TopPriorityCombo = {
  categorySlug: string;
  citySlug: string;
  coachCount: number;
  href: string;
};

const PRIORITY_CITY_SLUGS = new Set(["madrid", "barcelona"]);
const PRIORITY_CATEGORY_SLUGS = new Set(["personal", "carrera", "liderazgo"]);

const PRIORITY_CATEGORY_CANDIDATES = ["personal", "carrera", "liderazgo"] as const;
const PRIORITY_CITY_CANDIDATES = ["madrid", "barcelona", "valencia", "sevilla", "bilbao", "malaga"] as const;

const FALLBACK_PRIORITY_COMBO: TopPriorityCombo = {
  categorySlug: "personal",
  citySlug: "madrid",
  coachCount: 0,
  href: "/coaches/categoria/personal/madrid",
};

function percentile(sortedValues: number[], p: number) {
  if (!sortedValues.length) return null;
  if (sortedValues.length === 1) return sortedValues[0];

  const position = (sortedValues.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedValues[lower];
  const weight = position - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function roundPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

function truncate(text: string, max = 190) {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function computeLandingMetrics(items: CoachProfile[]): LandingMetrics {
  const coachCount = items.length;
  const prices = items
    .map((item) => item.basePriceEur)
    .filter((value): value is number => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  const onlineCount = items.filter((item) => item.sessionModes.includes("online")).length;
  const presencialCount = items.filter((item) => item.sessionModes.includes("presencial")).length;
  const certifiedCount = items.filter((item) => item.certifiedStatus === "approved").length;
  const reviewCount = items.reduce((sum, item) => sum + item.reviews.length, 0);

  return {
    coachCount,
    priceSampleCount: prices.length,
    priceMin: prices.length ? prices[0] : null,
    priceMax: prices.length ? prices[prices.length - 1] : null,
    priceMedian: percentile(prices, 0.5),
    priceP25: percentile(prices, 0.25),
    priceP75: percentile(prices, 0.75),
    onlinePercent: coachCount ? roundPercent((onlineCount / coachCount) * 100) : 0,
    presencialPercent: coachCount ? roundPercent((presencialCount / coachCount) * 100) : 0,
    certifiedPercent: coachCount ? roundPercent((certifiedCount / coachCount) * 100) : 0,
    reviewCount,
  };
}

export function buildPriceBandCopy(metrics: LandingMetrics) {
  if (metrics.priceSampleCount === 0 || metrics.priceMin == null || metrics.priceMax == null) {
    return "Aún no hay una muestra suficiente de precios públicos para estimar una banda estable.";
  }

  if (metrics.priceSampleCount < 3 || metrics.priceP25 == null || metrics.priceP75 == null) {
    return `Con la muestra actual, los precios visibles van de ${formatEuro(metrics.priceMin)} a ${formatEuro(metrics.priceMax)} por sesión (orientativo).`;
  }

  return `La mayoría se mueve entre ${formatEuro(metrics.priceP25)} y ${formatEuro(metrics.priceP75)} por sesión (orientativo), con casos desde ${formatEuro(metrics.priceMin)} hasta ${formatEuro(metrics.priceMax)}.`;
}

export function buildAnonymizedReviewSnippets(items: CoachProfile[], limit = 2): AnonymizedReviewSnippet[] {
  const all = items.flatMap((coach) =>
    coach.reviews
      .filter((review) => review.coachDecision === "approved")
      .map((review) => ({
        author: "Cliente verificado",
        rating: review.rating,
        body: truncate(review.body.trim()),
        createdAt: review.createdAt,
        cityLabel: coach.cityLabel.split(",")[0]?.trim() || undefined,
      })),
  );

  return all
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit)
    .map(({ author, rating, body, cityLabel }) => ({ author, rating, body, cityLabel }));
}

export function resolveTopPriorityCombo(allCoaches: CoachProfile[]): TopPriorityCombo {
  if (!allCoaches.length) return FALLBACK_PRIORITY_COMBO;

  let best: TopPriorityCombo | null = null;

  for (const categorySlug of PRIORITY_CATEGORY_CANDIDATES) {
    for (const citySlug of PRIORITY_CITY_CANDIDATES) {
      const coachCount = allCoaches.filter(
        (coach) => coach.citySlug === citySlug && coach.categories.includes(categorySlug),
      ).length;
      const href = `/coaches/categoria/${categorySlug}/${citySlug}`;
      if (!best) {
        best = { categorySlug, citySlug, coachCount, href };
        continue;
      }
      if (coachCount > best.coachCount) {
        best = { categorySlug, citySlug, coachCount, href };
        continue;
      }
      if (coachCount === best.coachCount && href.localeCompare(best.href, "es") < 0) {
        best = { categorySlug, citySlug, coachCount, href };
      }
    }
  }

  if (!best || best.coachCount <= 0) return FALLBACK_PRIORITY_COMBO;
  return best;
}

export function isPriorityLanding(input: PriorityLandingInput) {
  if (input.kind === "online" || input.kind === "certified") return true;
  if (input.kind === "city") return Boolean(input.citySlug && PRIORITY_CITY_SLUGS.has(input.citySlug));
  if (input.kind === "category") {
    return Boolean(input.categorySlug && PRIORITY_CATEGORY_SLUGS.has(input.categorySlug));
  }
  if (input.kind === "category_city") {
    if (!input.categorySlug || !input.citySlug) return false;
    const top = resolveTopPriorityCombo(input.allCoaches);
    return top.categorySlug === input.categorySlug && top.citySlug === input.citySlug;
  }
  return false;
}
