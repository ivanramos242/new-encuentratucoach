"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  parseCookieConsent,
  serializeCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";

type ConsentDraft = {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
    __etcCrispLoaded?: boolean;
  }
}

const OPEN_COOKIE_SETTINGS_EVENT = "etc-open-cookie-settings";

function loadCrisp() {
  if (typeof window === "undefined") return;
  if (window.__etcCrispLoaded) return;
  if (document.getElementById("etc-crisp-script")) {
    window.__etcCrispLoaded = true;
    return;
  }

  window.$crisp = window.$crisp || [];
  window.CRISP_WEBSITE_ID = "dd7f3530-1483-4546-91ca-7f47835087d7";
  const script = document.createElement("script");
  script.id = "etc-crisp-script";
  script.src = "https://client.crisp.chat/l.js";
  script.async = true;
  document.head.appendChild(script);
  window.__etcCrispLoaded = true;
}

function readConsentFromBrowser() {
  if (typeof window === "undefined") return null;
  const localValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  const parsedLocal = parseCookieConsent(localValue);
  if (parsedLocal) return parsedLocal;

  const cookieValue = document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`))
    ?.slice(COOKIE_CONSENT_COOKIE_NAME.length + 1);

  return parseCookieConsent(cookieValue ?? null);
}

function persistConsent(consent: CookieConsent) {
  if (typeof window === "undefined") return;
  const serialized = serializeCookieConsent(consent);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${serialized}; Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
}

export function CookieConsentManager() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [ready, setReady] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState<ConsentDraft>({
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readConsentFromBrowser();
      if (stored) {
        setConsent(stored);
        setDraft({
          analytics: stored.analytics,
          marketing: stored.marketing,
          preferences: stored.preferences,
        });
        setShowBanner(false);
      } else {
        setShowBanner(true);
      }
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !consent) return;
    if (consent.preferences) loadCrisp();
  }, [consent, ready]);

  useEffect(() => {
    function onOpenSettings() {
      setShowSettings(true);
      if (consent) setShowBanner(false);
    }
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
  }, [consent]);

  const hasDecision = useMemo(() => Boolean(consent), [consent]);

  function saveConsent(next: ConsentDraft) {
    const full: CookieConsent = {
      analytics: next.analytics,
      essentials: true,
      marketing: next.marketing,
      preferences: next.preferences,
      updatedAt: new Date().toISOString(),
      version: COOKIE_CONSENT_VERSION,
    };
    persistConsent(full);
    setConsent(full);
    setShowBanner(false);
    setShowSettings(false);
  }

  function acceptAll() {
    const allTrue = { analytics: true, marketing: true, preferences: true };
    setDraft(allTrue);
    saveConsent(allTrue);
  }

  function rejectAll() {
    const allFalse = { analytics: false, marketing: false, preferences: false };
    setDraft(allFalse);
    saveConsent(allFalse);
  }

  if (!ready) return null;

  return (
    <>
      {showBanner ? (
        <div className="fixed inset-x-3 bottom-3 z-[10000] mx-auto max-w-4xl rounded-2xl border border-black/10 bg-white p-4 shadow-2xl md:inset-x-6 md:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-zinc-500">Cookies y privacidad</p>
              <p className="mt-1 text-sm text-zinc-800">
                Usamos cookies técnicas necesarias y, solo con tu consentimiento, cookies opcionales (analítica,
                preferencias y marketing). Puedes aceptar, rechazar o configurar.
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                Más información en{" "}
                <Link href="/cookies" className="font-semibold underline underline-offset-2">
                  Política de Cookies
                </Link>{" "}
                y{" "}
                <Link href="/privacidad" className="font-semibold underline underline-offset-2">
                  Política de Privacidad
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Rechazar opcionales
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-xl bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSettings ? (
        <div className="fixed inset-0 z-[10001] grid place-items-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-5 shadow-2xl">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Configurar cookies</h2>
            <p className="mt-1 text-sm text-zinc-700">
              Puedes cambiar esta configuración en cualquier momento desde el botón “Cookies”.
            </p>

            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-black/10 bg-zinc-50 p-3">
                <p className="text-sm font-semibold text-zinc-900">Técnicas (siempre activas)</p>
                <p className="mt-1 text-xs text-zinc-600">Necesarias para seguridad, sesión y funcionamiento básico del sitio.</p>
              </div>

              <label className="flex items-start justify-between gap-4 rounded-xl border border-black/10 p-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Preferencias (incluye chat Crisp)</p>
                  <p className="mt-1 text-xs text-zinc-600">Recuerdan opciones de usuario y habilitan herramientas de soporte.</p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.preferences}
                  onChange={(event) => setDraft((prev) => ({ ...prev, preferences: event.target.checked }))}
                  className="mt-1 h-4 w-4"
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-xl border border-black/10 p-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Analítica</p>
                  <p className="mt-1 text-xs text-zinc-600">Miden uso del sitio para mejorar contenidos y rendimiento.</p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(event) => setDraft((prev) => ({ ...prev, analytics: event.target.checked }))}
                  className="mt-1 h-4 w-4"
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-xl border border-black/10 p-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Marketing</p>
                  <p className="mt-1 text-xs text-zinc-600">Personalizan campañas y miden conversión publicitaria.</p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.marketing}
                  onChange={(event) => setDraft((prev) => ({ ...prev, marketing: event.target.checked }))}
                  className="mt-1 h-4 w-4"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Rechazar opcionales
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Aceptar todas
              </button>
              <button
                type="button"
                onClick={() => saveConsent(draft)}
                className="rounded-xl bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Guardar selección
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {hasDecision ? (
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="fixed bottom-3 left-3 z-[9999] rounded-full border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-lg hover:bg-zinc-50"
          aria-label="Abrir configuración de cookies"
        >
          Cookies
        </button>
      ) : null}
    </>
  );
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
