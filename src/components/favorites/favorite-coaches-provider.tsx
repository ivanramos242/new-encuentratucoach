"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type FavoriteCoachesContextValue = {
  ready: boolean;
  authenticated: boolean;
  favoriteCoachIds: Set<string>;
  toggleFavorite: (coachProfileId: string) => Promise<"ok" | "auth_required" | "error">;
};

const FavoriteCoachesContext = createContext<FavoriteCoachesContextValue | null>(null);

export function FavoriteCoachesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [favoriteCoachIds, setFavoriteCoachIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const sessionRes = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "cache-control": "no-store" },
        });
        const sessionJson = (await sessionRes.json()) as { authenticated?: boolean };
        const auth = Boolean(sessionJson.authenticated);
        if (cancelled) return;
        setAuthenticated(auth);

        if (auth) {
          const favRes = await fetch("/api/favorites/coaches", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: { "cache-control": "no-store" },
          });
          if (!cancelled && favRes.ok) {
            const favJson = (await favRes.json()) as { favoriteCoachIds?: string[] };
            const ids = Array.isArray(favJson.favoriteCoachIds) ? favJson.favoriteCoachIds : [];
            setFavoriteCoachIds(new Set(ids));
          }
        } else {
          setFavoriteCoachIds(new Set());
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
          setFavoriteCoachIds(new Set());
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFavorite = useCallback(
    async (coachProfileId: string): Promise<"ok" | "auth_required" | "error"> => {
      if (!authenticated) return "auth_required";
      const previous = new Set(favoriteCoachIds);
      const currentlyFavorite = previous.has(coachProfileId);

      const optimistic = new Set(previous);
      if (currentlyFavorite) optimistic.delete(coachProfileId);
      else optimistic.add(coachProfileId);
      setFavoriteCoachIds(optimistic);

      try {
        const res = await fetch("/api/favorites/coaches", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ coachProfileId, favorite: !currentlyFavorite }),
        });

        if (res.status === 401) {
          setAuthenticated(false);
          setFavoriteCoachIds(new Set());
          return "auth_required";
        }
        if (!res.ok) {
          setFavoriteCoachIds(previous);
          return "error";
        }

        const json = (await res.json()) as { favoriteCoachIds?: string[] };
        const nextIds = Array.isArray(json.favoriteCoachIds) ? json.favoriteCoachIds : [];
        setFavoriteCoachIds(new Set(nextIds));
        return "ok";
      } catch {
        setFavoriteCoachIds(previous);
        return "error";
      }
    },
    [authenticated, favoriteCoachIds],
  );

  const value = useMemo<FavoriteCoachesContextValue>(
    () => ({ ready, authenticated, favoriteCoachIds, toggleFavorite }),
    [ready, authenticated, favoriteCoachIds, toggleFavorite],
  );

  return <FavoriteCoachesContext.Provider value={value}>{children}</FavoriteCoachesContext.Provider>;
}

export function useFavoriteCoaches() {
  const context = useContext(FavoriteCoachesContext);
  if (!context) {
    throw new Error("useFavoriteCoaches debe usarse dentro de FavoriteCoachesProvider");
  }
  return context;
}
