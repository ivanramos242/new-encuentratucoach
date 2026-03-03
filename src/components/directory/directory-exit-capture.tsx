"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isDirectoryLandingPathname } from "@/lib/directory-attribution";
import { setLastDirectoryPath, trackDirectoryFunnelEvent } from "@/lib/directory-funnel-client";

const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEYS = {
  dismissedAt: "etc_directory_exit_capture_dismissed_at",
  submittedAt: "etc_directory_exit_capture_submitted_at",
  lastShownAt: "etc_directory_exit_capture_last_shown_at",
};

type TriggerType = "exit_intent" | "mobile_banner";

function readTs(key: string) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function saveTs(key: string, value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
}

function shouldRespectCooldown(now: number) {
  const dismissedAt = readTs(STORAGE_KEYS.dismissedAt);
  const submittedAt = readTs(STORAGE_KEYS.submittedAt);
  const lastShownAt = readTs(STORAGE_KEYS.lastShownAt);

  if (submittedAt && now - submittedAt < DISMISS_COOLDOWN_MS) return true;
  if (dismissedAt && now - dismissedAt < DISMISS_COOLDOWN_MS) return true;
  if (lastShownAt && now - lastShownAt < SHOW_COOLDOWN_MS) return true;
  return false;
}

export function DirectoryExitCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTrigger, setActiveTrigger] = useState<TriggerType | null>(null);
  const [email, setEmail] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isDirectoryLanding = useMemo(() => isDirectoryLandingPathname(pathname), [pathname]);
  const sourcePath = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isDirectoryLanding) return;
    setLastDirectoryPath(sourcePath);
  }, [isDirectoryLanding, sourcePath]);

  useEffect(() => {
    setActiveTrigger(null);
    setFeedback(null);
    setEmail("");
    setPrivacyAccepted(false);
  }, [pathname]);

  useEffect(() => {
    if (!isDirectoryLanding) return;
    if (typeof window === "undefined") return;

    const now = Date.now();
    if (shouldRespectCooldown(now)) return;

    const isDesktop = window.innerWidth >= 1024;
    const isMobile = !isDesktop;
    let mobileTimer: number | null = null;

    const markShown = () => saveTs(STORAGE_KEYS.lastShownAt, Date.now());

    const onMouseLeave = (event: MouseEvent) => {
      if (!isDesktop) return;
      if (activeTrigger) return;
      if (event.clientY > 12) return;
      if (shouldRespectCooldown(Date.now())) return;
      setActiveTrigger("exit_intent");
      markShown();
    };

    const onScroll = () => {
      if (!isMobile || activeTrigger) return;
      const scrollTop = window.scrollY || 0;
      const maxScrollable = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const ratio = scrollTop / maxScrollable;
      if (ratio >= 0.4 && !shouldRespectCooldown(Date.now())) {
        setActiveTrigger("mobile_banner");
        markShown();
      }
    };

    if (isDesktop) {
      document.addEventListener("mouseleave", onMouseLeave);
    } else {
      mobileTimer = window.setTimeout(() => {
        if (activeTrigger || shouldRespectCooldown(Date.now())) return;
        setActiveTrigger("mobile_banner");
        markShown();
      }, 15000);
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      if (mobileTimer != null) window.clearTimeout(mobileTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [activeTrigger, isDirectoryLanding]);

  if (!isDirectoryLanding || !activeTrigger) return null;

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/leads/directory-assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          sourcePath,
          trigger: activeTrigger,
          privacyAccepted,
          honeypot: "",
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.message || "No se pudo enviar.");

      saveTs(STORAGE_KEYS.submittedAt, Date.now());
      trackDirectoryFunnelEvent("submit_form", { sourcePath });
      setFeedback(payload.message || "Te contactaremos por email.");
      setActiveTrigger(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo enviar.");
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    saveTs(STORAGE_KEYS.dismissedAt, Date.now());
    setActiveTrigger(null);
  }

  if (activeTrigger === "mobile_banner") {
    return (
      <div className="fixed inset-x-3 bottom-[70px] z-[10020] rounded-2xl border border-black/10 bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[420px]">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
          aria-label="Cerrar"
        >
          Cerrar
        </button>
        <h3 className="text-base font-black tracking-tight text-zinc-950">Te ayudamos a elegir coach</h3>
        <p className="mt-1 text-sm text-zinc-700">Deja tu email y te enviamos una recomendacion rapida.</p>
        <form onSubmit={submitLead} className="mt-3 grid gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="tu@email.com"
            className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          />
          <label className="flex items-start gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(event) => setPrivacyAccepted(event.currentTarget.checked)}
              required
            />
            <span>Acepto la politica de privacidad para recibir ayuda por email.</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-zinc-950 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Quiero ayuda"}
          </button>
          {feedback ? <p className="text-xs text-zinc-700">{feedback}</p> : null}
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10030] grid place-items-center bg-black/45 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white p-5 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-md px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
          aria-label="Cerrar"
        >
          Cerrar
        </button>
        <h3 className="text-xl font-black tracking-tight text-zinc-950">Antes de salir</h3>
        <p className="mt-1 text-sm text-zinc-700">
          Si quieres, te orientamos por email para elegir 2 o 3 coaches con mejor encaje.
        </p>
        <form onSubmit={submitLead} className="mt-4 grid gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="tu@email.com"
            className="rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
          />
          <label className="flex items-start gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(event) => setPrivacyAccepted(event.currentTarget.checked)}
              required
            />
            <span>Acepto la politica de privacidad para recibir ayuda por email.</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-zinc-950 px-3 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Recibir ayuda"}
          </button>
          {feedback ? <p className="text-xs text-zinc-700">{feedback}</p> : null}
        </form>
      </div>
    </div>
  );
}
