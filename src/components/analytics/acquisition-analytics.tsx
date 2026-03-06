"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  parseCookieConsent,
} from "@/lib/cookie-consent";

function readAnalyticsConsent() {
  if (typeof window === "undefined") return false;

  try {
    const local = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    const parsed = parseCookieConsent(local);
    if (parsed) return parsed.analytics;
  } catch {
    // no-op
  }

  const cookieValue = document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith("etc_cookie_consent="))
    ?.slice("etc_cookie_consent=".length);

  return Boolean(parseCookieConsent(cookieValue ?? null)?.analytics);
}

export function AcquisitionAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();

  useEffect(() => {
    const syncConsent = () => setAnalyticsEnabled(readAnalyticsConsent());

    syncConsent();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncConsent);
    window.addEventListener("storage", syncConsent);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncConsent);
      window.removeEventListener("storage", syncConsent);
    };
  }, []);

  const pagePath = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!analyticsEnabled || !gaMeasurementId || typeof window.gtag !== "function") return;
    window.gtag("config", gaMeasurementId, {
      page_path: pagePath,
    });
  }, [analyticsEnabled, gaMeasurementId, pagePath]);

  if (!analyticsEnabled) return null;

  return (
    <>
      {gaMeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="etc-ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', { send_page_view: true });
            `}
          </Script>
        </>
      ) : null}

      {clarityProjectId ? (
        <Script id="etc-clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityProjectId}");
          `}
        </Script>
      ) : null}
    </>
  );
}
