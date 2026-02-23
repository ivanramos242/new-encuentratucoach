import { coachCategories, coaches, cities } from "@/lib/mock-data";
import { average } from "@/lib/utils";
import type { CoachProfile, DirectoryFilters, SessionMode } from "@/types/domain";

export const PAGE_SIZE = 9;

export function getVisibleCoaches() {
  return coaches.filter((coach) => coach.visibilityActive && coach.profileStatus === "published");
}

export function getCoachBySlug(slug: string) {
  return getVisibleCoaches().find((coach) => coach.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return coachCategories.find((category) => category.slug === slug);
}

export function getCityBySlug(slug: string) {
  return cities.find((city) => city.slug === slug);
}

export function getCoachAverageRating(coach: CoachProfile) {
  const approved = coach.reviews.filter((review) => review.coachDecision === "approved");
  return average(approved.map((review) => review.rating));
}

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function parseDirectoryFilters(input: Record<string, string | string[] | undefined>): DirectoryFilters {
  const one = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
  const num = (value?: string | string[]) => {
    const parsed = Number(one(value));
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const sessionSource = input.session ?? input["session[]"];
  const sessionValues = (Array.isArray(sessionSource) ? sessionSource : sessionSource ? [sessionSource] : [])
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is SessionMode => value === "online" || value === "presencial");

  const sort = one(input.sort);
  return {
    q: one(input.q)?.trim() || undefined,
    cat: one(input.cat)?.trim() || undefined,
    location: one(input.location)?.trim() || undefined,
    session: sessionValues,
    certified:
      one(input.certified) === "certified" || one(input.certified) === "true" ? true : undefined,
    idioma: one(input.idioma)?.trim() || undefined,
    priceMin: num(input.price_min) ?? num(input.priceMin),
    priceMax: num(input.price_max) ?? num(input.priceMax),
    sort:
      sort === "price_asc" || sort === "price_desc" || sort === "rating_desc" || sort === "recent"
        ? sort
        : "recent",
    page: Math.max(1, num(input.page) ?? 1),
  };
}

export function filterAndSortCoaches(filters: DirectoryFilters) {
  let list = [...getVisibleCoaches()];

  if (filters.q) {
    const q = normalize(filters.q);
    list = list.filter((coach) =>
      normalize(
        [
          coach.name,
          coach.headline,
          coach.bio,
          coach.cityLabel,
          coach.categories.join(" "),
          coach.specialties.join(" "),
        ].join(" "),
      ).includes(q),
    );
  }

  if (filters.cat) {
    list = list.filter((coach) => coach.categories.includes(filters.cat!));
  }

  if (filters.location) {
    const location = normalize(filters.location);
    list = list.filter(
      (coach) => coach.citySlug === location || normalize(coach.cityLabel).includes(location),
    );
  }

  if (filters.session?.length) {
    list = list.filter((coach) => filters.session!.every((mode) => coach.sessionModes.includes(mode)));
  }

  if (filters.certified) {
    list = list.filter((coach) => coach.certifiedStatus === "approved");
  }

  if (filters.idioma) {
    const idioma = normalize(filters.idioma);
    list = list.filter((coach) => coach.languages.some((lang) => normalize(lang).includes(idioma)));
  }

  if (typeof filters.priceMin === "number") {
    list = list.filter((coach) => coach.basePriceEur >= filters.priceMin!);
  }
  if (typeof filters.priceMax === "number") {
    list = list.filter((coach) => coach.basePriceEur <= filters.priceMax!);
  }

  switch (filters.sort) {
    case "price_asc":
      list.sort((a, b) => a.basePriceEur - b.basePriceEur);
      break;
    case "price_desc":
      list.sort((a, b) => b.basePriceEur - a.basePriceEur);
      break;
    case "rating_desc":
      list.sort((a, b) => getCoachAverageRating(b) - getCoachAverageRating(a));
      break;
    case "recent":
    default:
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      break;
  }

  return list;
}

export function paginateCoaches(items: CoachProfile[], page: number, pageSize = PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    currentPage,
    pageSize,
  };
}

export function getLatestCoaches(limit = 6) {
  return [...getVisibleCoaches()]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit);
}

export function getRelatedCoaches(coach: CoachProfile, limit = 3) {
  return getVisibleCoaches()
    .filter((item) => item.id !== coach.id)
    .sort((a, b) => {
      const aOverlap = a.categories.filter((cat) => coach.categories.includes(cat)).length;
      const bOverlap = b.categories.filter((cat) => coach.categories.includes(cat)).length;
      if (aOverlap !== bOverlap) return bOverlap - aOverlap;
      return b.featured === a.featured ? 0 : b.featured ? 1 : -1;
    })
    .slice(0, limit);
}
