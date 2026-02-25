"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Container } from "@/components/layout/container";
import { siteNav } from "@/lib/site-config";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type HeaderSessionUser = {
  id: string;
  role: "admin" | "coach" | "client";
  displayName?: string | null;
};

type HeaderSessionState = {
  loading: boolean;
  authenticated: boolean;
  user: HeaderSessionUser | null;
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const headerRef = useRef<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [topStripCollapsed, setTopStripCollapsed] = useState(false);
  const [pendingLogout, startLogout] = useTransition();
  const [session, setSession] = useState<HeaderSessionState>({
    loading: true,
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "cache-control": "no-store" },
        });
        const json = (await res.json()) as { authenticated?: boolean; user?: HeaderSessionUser | null };
        if (!cancelled) {
          setSession({
            loading: false,
            authenticated: Boolean(json.authenticated),
            user: json.user ?? null,
          });
        }
      } catch {
        if (!cancelled) {
          setSession({ loading: false, authenticated: false, user: null });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setTopStripCollapsed(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const rootStyle = document.documentElement.style;
    const updateHeaderOffset = () => {
      const height = Math.round(headerEl.getBoundingClientRect().height);
      rootStyle.setProperty("--site-header-offset", `${height}px`);
    };

    updateHeaderOffset();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateHeaderOffset);
      ro.observe(headerEl);
    }
    window.addEventListener("resize", updateHeaderOffset);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateHeaderOffset);
    };
  }, [menuOpen, topStripCollapsed]);

  const accountHref =
    session.user?.role === "admin"
      ? "/admin"
      : session.user?.role === "coach"
        ? "/mi-cuenta/coach"
        : "/mi-cuenta/cliente";

  function handleLogout() {
    startLogout(async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
      } catch {}
      setSession({ loading: false, authenticated: false, user: null });
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    });
  }

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <div
        className="overflow-hidden transition-[height,opacity] duration-200 ease-out"
        style={{ height: topStripCollapsed ? 0 : 44, opacity: topStripCollapsed ? 0 : 1 }}
        aria-hidden={topStripCollapsed}
      >
        <div className="border-b border-black/5 bg-white">
          <Container className="flex h-11 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-600">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="truncate">Directorio de coaches en España</span>
            </div>
            <div className="hidden items-center gap-5 text-sm font-medium text-zinc-700 sm:flex">
              <Link href="/membresia" className="hover:text-zinc-950">
                Unirse como coach
              </Link>
              <Link href="/contacto" className="hover:text-zinc-950">
                Ayuda
              </Link>
            </div>
          </Container>
        </div>
      </div>

      <Container className="flex items-center gap-3 py-3 sm:gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 font-black text-white shadow">
            ET
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Encuentra</div>
            <div className="text-base font-black tracking-tight text-zinc-950">TuCoach</div>
          </div>
        </Link>

        <nav className="ml-1 hidden flex-1 justify-center lg:flex" aria-label="Principal">
          <ul className="flex flex-wrap items-center justify-center gap-1">
            {siteNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-semibold transition",
                      active ? "bg-cyan-50 text-cyan-800" : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 xl:flex">
          {session.authenticated ? (
            <>
              <Link
                href={accountHref}
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                {session.user?.role === "admin" ? "Admin" : "Mi cuenta"}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={pendingLogout}
                className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {pendingLogout ? "Saliendo..." : "Cerrar sesión"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/iniciar-sesion"
                className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                {session.loading ? "Cargando..." : "Iniciar sesión"}
              </Link>
              <Link
                href="/membresia"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95"
              >
                Soy coach
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="ml-auto inline-flex rounded-xl border border-black/10 bg-white p-2 text-zinc-900 lg:hidden"
        >
          <span className="sr-only">Abrir menú</span>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </Container>

      {menuOpen ? (
        <div id="mobile-menu" className="border-t border-black/5 bg-white lg:hidden">
          <Container className="py-4">
            <div className="mb-4 grid gap-2 rounded-2xl border border-black/10 bg-zinc-50 p-3 sm:hidden">
              <Link
                href="/membresia"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
              >
                Unirse como coach
              </Link>
              <Link
                href="/contacto"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
              >
                Ayuda
              </Link>
            </div>

            <ul className="grid gap-2">
              {siteNav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "block rounded-xl px-3 py-3 text-sm font-semibold",
                        active ? "bg-cyan-50 text-cyan-800" : "bg-zinc-50 text-zinc-800",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 grid gap-2">
              {session.authenticated ? (
                <>
                  <Link
                    href={accountHref}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-black/10 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900"
                  >
                    {session.user?.role === "admin" ? "Ir al admin" : "Mi cuenta"}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={pendingLogout}
                    className="rounded-xl bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {pendingLogout ? "Saliendo..." : "Cerrar sesión"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/iniciar-sesion"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-black/10 bg-white px-4 py-3 text-center text-sm font-semibold text-zinc-900"
                  >
                    {session.loading ? "Cargando..." : "Iniciar sesión"}
                  </Link>
                  <Link
                    href="/membresia"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Membresía para coaches
                  </Link>
                </>
              )}
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
