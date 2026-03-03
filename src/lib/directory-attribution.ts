export type DirectoryLandingType =
  | "directory"
  | "city"
  | "category"
  | "category_city"
  | "online"
  | "certified";

export type DerivedDirectoryLanding = {
  landingPath: string;
  landingType: DirectoryLandingType;
  citySlug?: string;
  categorySlug?: string;
};

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export function normalizeSourcePath(input?: string | null): string | null {
  if (!input || typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;

  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const url = new URL(raw);
      return url.pathname || "/";
    }
  } catch {
    return null;
  }

  if (raw.startsWith("/")) {
    const noHash = raw.split("#")[0] || "/";
    return noHash.split("?")[0] || "/";
  }

  return null;
}

export function deriveDirectoryLandingFromPath(inputPath?: string | null): DerivedDirectoryLanding | null {
  const normalized = normalizeSourcePath(inputPath);
  if (!normalized) return null;

  const pathname = normalized.split("?")[0] || "/";
  const segments = trimSlashes(pathname).split("/").filter(Boolean);

  if (segments.length === 1 && segments[0] === "coaches") {
    return {
      landingPath: "/coaches",
      landingType: "directory",
    };
  }

  if (segments[0] !== "coaches") return null;

  if (segments.length === 3 && segments[1] === "ciudad") {
    return {
      landingPath: `/coaches/ciudad/${segments[2]}`,
      landingType: "city",
      citySlug: segments[2],
    };
  }

  if (segments.length === 3 && segments[1] === "categoria") {
    return {
      landingPath: `/coaches/categoria/${segments[2]}`,
      landingType: "category",
      categorySlug: segments[2],
    };
  }

  if (segments.length === 4 && segments[1] === "categoria") {
    return {
      landingPath: `/coaches/categoria/${segments[2]}/${segments[3]}`,
      landingType: "category_city",
      categorySlug: segments[2],
      citySlug: segments[3],
    };
  }

  if (segments.length === 3 && segments[1] === "modalidad" && segments[2] === "online") {
    return {
      landingPath: "/coaches/modalidad/online",
      landingType: "online",
    };
  }

  if (segments.length === 2 && segments[1] === "certificados") {
    return {
      landingPath: "/coaches/certificados",
      landingType: "certified",
    };
  }

  return null;
}

export function isDirectoryLandingPathname(pathname?: string | null) {
  return Boolean(deriveDirectoryLandingFromPath(pathname));
}

export function getSameOriginReferrerPath() {
  if (typeof window === "undefined" || !document.referrer) return null;
  try {
    const ref = new URL(document.referrer);
    if (ref.origin !== window.location.origin) return null;
    return `${ref.pathname || "/"}${ref.search || ""}`;
  } catch {
    return null;
  }
}
