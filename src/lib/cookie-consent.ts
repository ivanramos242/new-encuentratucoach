export const COOKIE_CONSENT_COOKIE_NAME = "etc_cookie_consent";
export const COOKIE_CONSENT_STORAGE_KEY = "etc_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
export const COOKIE_CONSENT_UPDATED_EVENT = "etc-cookie-consent-updated";

export type CookieConsent = {
  analytics: boolean;
  essentials: true;
  marketing: boolean;
  preferences: boolean;
  updatedAt: string;
  version: number;
};

export function defaultCookieConsent(): CookieConsent {
  return {
    analytics: false,
    essentials: true,
    marketing: false,
    preferences: false,
    updatedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };
}

export function parseCookieConsent(value?: string | null): CookieConsent | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as Partial<CookieConsent>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    if (typeof parsed.preferences !== "boolean") return null;
    if (typeof parsed.analytics !== "boolean") return null;
    if (typeof parsed.marketing !== "boolean") return null;
    if (typeof parsed.updatedAt !== "string") return null;
    return {
      analytics: parsed.analytics,
      essentials: true,
      marketing: parsed.marketing,
      preferences: parsed.preferences,
      updatedAt: parsed.updatedAt,
      version: COOKIE_CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

export function serializeCookieConsent(consent: CookieConsent) {
  return encodeURIComponent(JSON.stringify(consent));
}
