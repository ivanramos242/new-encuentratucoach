import { getCategoryBySlug, getCityBySlug, isIndexableCategorySlug, resolveCitySlug } from "@/lib/directory";
import type { LandingContextLink, LandingExploreCard } from "@/lib/landing-content";
import type { CoachProfile } from "@/types/domain";

type CountItem = {
  slug: string;
  label: string;
  count: number;
};

export function countCategories(items: CoachProfile[]) {
  const counts = new Map<string, number>();
  for (const coach of items) {
    for (const categorySlug of coach.categories) {
      counts.set(categorySlug, (counts.get(categorySlug) ?? 0) + 1);
    }
  }
  return counts;
}

export function countCities(items: CoachProfile[]) {
  const counts = new Map<string, number>();
  for (const coach of items) {
    counts.set(coach.citySlug, (counts.get(coach.citySlug) ?? 0) + 1);
  }
  return counts;
}

export function topCategoryItems(items: CoachProfile[], limit = 6): CountItem[] {
  return Array.from(countCategories(items).entries())
    .filter(([slug]) => isIndexableCategorySlug(slug))
    .map(([slug, count]) => ({
      slug,
      count,
      label: getCategoryBySlug(slug)?.name ?? slug,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function topCityItems(items: CoachProfile[], limit = 6): CountItem[] {
  return Array.from(countCities(items).entries())
    .map(([slug, count]) => [resolveCitySlug(slug), count] as const)
    .filter((item): item is readonly [string, number] => Boolean(item[0]))
    .map(([slug, count]) => ({
      slug,
      count,
      label: getCityBySlug(slug)?.name ?? slug,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function buildCityContextLinks(citySlug: string, items: CountItem[]): LandingContextLink[] {
  const links: LandingContextLink[] = [
    { label: "Todos los coaches", href: "/coaches" },
    { label: "Online", href: "/coaches/modalidad/online" },
    { label: "Certificados", href: "/coaches/certificados" },
  ];
  for (const item of items.slice(0, 3)) {
    links.push({
      label: `${item.label} en esta ciudad`,
      href: `/coaches/categoria/${item.slug}/${citySlug}`,
    });
  }
  return links.slice(0, 6);
}

export function buildCategoryContextLinks(categorySlug: string, items: CountItem[]): LandingContextLink[] {
  const links: LandingContextLink[] = [
    { label: "Todos los coaches", href: "/coaches" },
    { label: "Online", href: "/coaches/modalidad/online" },
  ];
  for (const item of items.slice(0, 4)) {
    links.push({
      label: `${item.label}`,
      href: `/coaches/categoria/${categorySlug}/${item.slug}`,
    });
  }
  return links.slice(0, 6);
}

export function buildCategoryCityContextLinks(
  categorySlug: string,
  citySlug: string,
  cityName: string,
): LandingContextLink[] {
  return [
    { label: "Ver toda la categoría", href: `/coaches/categoria/${categorySlug}` },
    { label: `Ver todos en ${cityName}`, href: `/coaches/ciudad/${citySlug}` },
    { label: "Online", href: "/coaches/modalidad/online" },
    { label: "Certificados", href: "/coaches/certificados" },
  ];
}

export function buildExploreCardsForCity(citySlug: string, items: CountItem[]): LandingExploreCard[] {
  return items.slice(0, 6).map((item) => ({
    title: `${item.label} en esta ciudad`,
    description: `${item.count} ${item.count === 1 ? "perfil" : "perfiles"} disponibles`,
    href: `/coaches/categoria/${item.slug}/${citySlug}`,
    ctaLabel: "Ver perfiles",
  }));
}

export function buildExploreCardsForCategory(categorySlug: string, items: CountItem[]): LandingExploreCard[] {
  return items.slice(0, 6).map((item) => ({
    title: `${item.label}`,
    description: `${item.count} ${item.count === 1 ? "perfil" : "perfiles"} en esta combinación`,
    href: `/coaches/categoria/${categorySlug}/${item.slug}`,
    ctaLabel: "Ver ciudad",
  }));
}

export function buildExploreCardsForOnline(items: CountItem[]): LandingExploreCard[] {
  return items.slice(0, 6).map((item) => ({
    title: item.label,
    description: `${item.count} ${item.count === 1 ? "coach online" : "coaches online"}`,
    href: `/coaches/categoria/${item.slug}`,
    ctaLabel: "Ver especialidad",
  }));
}

export function buildExploreCardsForCertified(items: CountItem[]): LandingExploreCard[] {
  return items.slice(0, 6).map((item) => ({
    title: item.label,
    description: `${item.count} ${item.count === 1 ? "coach certificado" : "coaches certificados"}`,
    href: `/coaches/ciudad/${item.slug}`,
    ctaLabel: "Ver ciudad",
  }));
}
