"use client";

import { COOKIE_CONSENT_STORAGE_KEY, parseCookieConsent } from "@/lib/cookie-consent";
import { normalizeSourcePath } from "@/lib/directory-attribution";

export type DirectoryFunnelEventType =
  | "view_profile"
  | "click_whatsapp"
  | "click_contact"
  | "submit_form"
  | "booking_start";

export type DirectoryFunnelSourceModule =
  | "home"
  | "directory"
  | "landing_city"
  | "landing_category"
  | "landing_category_city"
  | "landing_online"
  | "landing_certified"
  | "coach_profile"
  | "qa"
  | "blog"
  | "membership"
  | "other";

const LAST_DIRECTORY_PATH_KEY = "etc_last_directory_path";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${name}=`));
  if (!raw) return null;
  return raw.slice(name.length + 1);
}

export function hasAnalyticsConsentInBrowser() {
  if (typeof window === "undefined") return false;
  try {
    const local = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    const fromLocal = parseCookieConsent(local);
    if (fromLocal) return Boolean(fromLocal.analytics);
  } catch {
    // no-op
  }

  const cookieValue = readCookie("etc_cookie_consent");
  const fromCookie = parseCookieConsent(cookieValue);
  return Boolean(fromCookie?.analytics);
}

export function setLastDirectoryPath(pathname: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeSourcePath(pathname);
  if (!normalized) return;
  try {
    window.sessionStorage.setItem(LAST_DIRECTORY_PATH_KEY, normalized);
  } catch {
    // no-op
  }
}

export function getLastDirectoryPath() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(LAST_DIRECTORY_PATH_KEY);
    return normalizeSourcePath(value);
  } catch {
    return null;
  }
}

export function trackDirectoryFunnelEvent(
  eventType: DirectoryFunnelEventType,
  input?: {
    coachProfileId?: string;
    sourcePath?: string | null;
    sourceModule?: DirectoryFunnelSourceModule;
    metadata?: Record<string, unknown>;
  },
) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsentInBrowser()) return;

  const normalizedSourcePath = normalizeSourcePath(input?.sourcePath) || undefined;
  const sourceModule = input?.sourceModule || inferSourceModuleFromPath(normalizedSourcePath);
  const metadata = {
    ...(input?.metadata || {}),
    sourcePath: normalizedSourcePath,
    sourceModule,
  };

  const payload = JSON.stringify({
    eventType,
    coachProfileId: input?.coachProfileId,
    sourcePath: normalizedSourcePath,
    metadata,
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/directory-funnel", blob);
      return;
    }
  } catch {
    // fallback below
  }

  void fetch("/api/analytics/directory-funnel", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

function inferSourceModuleFromPath(path?: string) {
  if (!path) return "other";
  if (path === "/") return "home";
  if (path.startsWith("/coaches/categoria/")) {
    const segments = path.split("/").filter(Boolean);
    return segments.length >= 4 ? "landing_category_city" : "landing_category";
  }
  if (path.startsWith("/coaches/ciudad/")) return "landing_city";
  if (path === "/coaches/modalidad/online") return "landing_online";
  if (path === "/coaches/certificados") return "landing_certified";
  if (path === "/coaches") return "directory";
  if (path.startsWith("/coaches/")) return "coach_profile";
  if (path.startsWith("/pregunta-a-un-coach")) return "qa";
  if (path.startsWith("/blog")) return "blog";
  if (path.startsWith("/membresia") || path === "/plataformas-para-trabajar-como-coach") return "membership";
  return "other";
}
