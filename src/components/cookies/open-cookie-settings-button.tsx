"use client";

import { openCookieSettings } from "@/components/cookies/cookie-consent-manager";

export function OpenCookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
    >
      Configurar cookies
    </button>
  );
}
