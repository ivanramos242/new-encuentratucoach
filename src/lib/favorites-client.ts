export const FAVORITE_COACHES_STORAGE_KEY = "etc.favorite.coaches";
export const CLIENT_AUTH_STORAGE_KEY = "etc.client.auth";

type FavoriteCoachId = string;

function safeParse(input: string | null): FavoriteCoachId[] {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is FavoriteCoachId => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function getFavoriteCoachIds(): FavoriteCoachId[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(FAVORITE_COACHES_STORAGE_KEY));
}

export function isCoachFavorite(coachId: string): boolean {
  return getFavoriteCoachIds().includes(coachId);
}

export function setCoachFavorite(coachId: string, favorite: boolean): FavoriteCoachId[] {
  const current = new Set(getFavoriteCoachIds());
  if (favorite) current.add(coachId);
  else current.delete(coachId);
  const next = Array.from(current);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(FAVORITE_COACHES_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("etc:favorites:changed"));
  }
  return next;
}

export function setClientMockAuthenticated(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(CLIENT_AUTH_STORAGE_KEY, "1");
  else window.localStorage.removeItem(CLIENT_AUTH_STORAGE_KEY);
}

export function isClientMockAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CLIENT_AUTH_STORAGE_KEY) === "1";
}
