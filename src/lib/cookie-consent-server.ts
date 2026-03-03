import { COOKIE_CONSENT_COOKIE_NAME, parseCookieConsent } from "@/lib/cookie-consent";

function getCookieValue(cookieHeader: string, name: string) {
  const chunks = cookieHeader.split(";").map((chunk) => chunk.trim());
  for (const chunk of chunks) {
    if (chunk.startsWith(`${name}=`)) {
      return chunk.slice(name.length + 1);
    }
  }
  return null;
}

export function hasAnalyticsConsentFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader) return false;
  const rawValue = getCookieValue(cookieHeader, COOKIE_CONSENT_COOKIE_NAME);
  const consent = parseCookieConsent(rawValue);
  return Boolean(consent?.analytics);
}
