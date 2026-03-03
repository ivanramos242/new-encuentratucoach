"use client";

import { COOKIE_CONSENT_STORAGE_KEY, parseCookieConsent } from "@/lib/cookie-consent";
import { normalizeSourcePath } from "@/lib/directory-attribution";

export type DirectoryFunnelEventType =
  | "view_profile"
  | "click_whatsapp"
  | "click_contact"
  | "submit_form"
  | "booking_start";

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
    metadata?: Record<string, unknown>;
  },
) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsentInBrowser()) return;

  const payload = JSON.stringify({
    eventType,
    coachProfileId: input?.coachProfileId,
    sourcePath: normalizeSourcePath(input?.sourcePath) || undefined,
    metadata: input?.metadata,
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
