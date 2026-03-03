"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowUpRightFromSquare,
  faBell,
  faChartColumn,
  faComments,
  faCreditCard,
  faFileSignature,
  faHouse,
  faIdCard,
  faStar,
  faUserPen,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "@/lib/utils";

type AccountRole = "admin" | "coach" | "client";

type NavItem = {
  href: string;
  label: string;
  icon: IconDefinition;
  badge?: string;
  external?: boolean;
};

type SectionStateTone = "neutral" | "success" | "warning" | "danger";

type SectionState = {
  label: string;
  tone: SectionStateTone;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/mi-cuenta" || href === "/mi-cuenta/coach" || href === "/mi-cuenta/cliente" || href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleLabel(role: AccountRole) {
  if (role === "coach") return "Coach";
  if (role === "client") return "Cliente";
  return "Admin";
}

function getRoleNavigation(role: AccountRole, unreadMessagesCount: number) {
  if (role === "coach") {
    return {
      homeHref: "/mi-cuenta/coach",
      main: [
        { href: "/mi-cuenta/coach", label: "Panel", icon: faHouse },
        { href: "/mi-cuenta/coach/perfil", label: "Perfil", icon: faUserPen },
        { href: "/mi-cuenta/coach/membresia", label: "Membresia", icon: faCreditCard },
        {
          href: "/mi-cuenta/coach/mensajes",
          label: "Mensajes",
          icon: faComments,
          badge: unreadMessagesCount > 0 ? (unreadMessagesCount > 99 ? "99+" : String(unreadMessagesCount)) : undefined,
        },
        { href: "/mi-cuenta/coach/notificaciones", label: "Notificaciones", icon: faBell },
      ] satisfies NavItem[],
      support: [
        { href: "/mi-cuenta/coach/certificacion", label: "Certificacion", icon: faFileSignature },
        { href: "/mi-cuenta/coach/metricas", label: "Metricas", icon: faChartColumn },
        { href: "/mi-cuenta/coach/resenas", label: "Resenas", icon: faStar },
        { href: "/coaches", label: "Directorio", icon: faArrowUpRightFromSquare, external: true },
      ] satisfies NavItem[],
    };
  }

  if (role === "client") {
    return {
      homeHref: "/mi-cuenta/cliente",
      main: [
        { href: "/mi-cuenta/cliente", label: "Panel", icon: faHouse },
        {
          href: "/mi-cuenta/cliente/mensajes",
          label: "Mensajes",
          icon: faComments,
          badge: unreadMessagesCount > 0 ? (unreadMessagesCount > 99 ? "99+" : String(unreadMessagesCount)) : undefined,
        },
        { href: "/mi-cuenta/cliente/notificaciones", label: "Notificaciones", icon: faBell },
        { href: "/mi-cuenta/cliente/resenas", label: "Resenas", icon: faStar },
      ] satisfies NavItem[],
      support: [
        { href: "/coaches", label: "Buscar coaches", icon: faUsers, external: true },
        { href: "/pregunta-a-un-coach", label: "Pregunta a un coach", icon: faIdCard, external: true },
      ] satisfies NavItem[],
    };
  }

  return {
    homeHref: "/admin",
    main: [{ href: "/admin", label: "Panel admin", icon: faHouse }] satisfies NavItem[],
    support: [] satisfies NavItem[],
  };
}

export function AccountShell({
  role,
  displayName,
  email,
  unreadMessagesCount,
  sectionStates,
  children,
}: {
  role: AccountRole;
  displayName: string | null;
  email: string;
  unreadMessagesCount: number;
  sectionStates?: Partial<Record<string, SectionState>>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = getRoleNavigation(role, unreadMessagesCount);
  const mobileNavItems = [...nav.main, ...nav.support];

  return (
    <div className="mx-auto grid w-full max-w-[1700px] gap-5 px-3 pb-8 pt-4 max-[390px]:gap-4 max-[390px]:px-2 max-[390px]:pt-3 sm:px-4 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:pt-6 xl:px-8">
      <aside className="hidden self-start lg:sticky lg:top-[calc(var(--site-header-offset,72px)+16px)] lg:block">
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
          <Link href={nav.homeHref} className="block rounded-2xl border border-black/10 bg-zinc-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{roleLabel(role)}</p>
            <p className="mt-0.5 truncate text-sm font-bold text-zinc-950">{displayName || "Mi cuenta"}</p>
            <p className="truncate text-xs text-zinc-600">{email}</p>
          </Link>

          <nav className="mt-4" aria-label="Navegacion principal de cuenta">
            <ul className="space-y-1">
              {nav.main.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <AccountNavLink item={item} active={active} state={sectionStates?.[item.href]} />
                  </li>
                );
              })}
            </ul>
          </nav>

          {nav.support.length ? (
            <>
              <p className="mt-5 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Gestion</p>
              <ul className="mt-2 space-y-1">
                {nav.support.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <AccountNavLink item={item} active={active} state={sectionStates?.[item.href]} />
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      </aside>

      <div>
        <div className="sticky top-[calc(var(--site-header-offset,72px)+6px)] z-20 rounded-2xl border border-black/10 bg-white p-2 shadow-sm max-[390px]:p-1.5 lg:hidden">
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {mobileNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <AccountNavChip key={item.href} item={item} active={active} state={sectionStates?.[item.href]} />
              );
            })}
          </div>
        </div>
        <div className="mt-3 lg:mt-0">{children}</div>
      </div>
    </div>
  );
}

function AccountNavLink({ item, active, state }: { item: NavItem; active: boolean; state?: SectionState }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition",
        active ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100" : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950",
      )}
    >
      <span className="inline-flex items-center gap-2">
        <FontAwesomeIcon icon={item.icon} className="h-3.5 w-3.5 text-zinc-500" />
        {item.label}
      </span>
      {item.badge ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          {item.badge}
        </span>
      ) : state ? (
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", sectionStateToneClass(state.tone))}>
          {state.label}
        </span>
      ) : item.external ? (
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3 text-zinc-500" />
      ) : null}
    </Link>
  );
}

function AccountNavChip({ item, active, state }: { item: NavItem; active: boolean; state?: SectionState }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "inline-flex shrink-0 snap-start items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap max-[430px]:gap-1.5 max-[430px]:px-2.5 max-[390px]:text-xs max-[390px]:px-2 max-[390px]:py-1.5",
        active ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100" : "border border-black/10 bg-white text-zinc-800",
      )}
    >
      <FontAwesomeIcon icon={item.icon} className="h-3.5 w-3.5 text-zinc-500 max-[390px]:h-3 max-[390px]:w-3" />
      {item.label}
      {item.badge ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          {item.badge}
        </span>
      ) : state ? (
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", sectionStateToneClass(state.tone))}>
          {state.label}
        </span>
      ) : item.external ? (
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3 text-zinc-500" />
      ) : null}
    </Link>
  );
}

function sectionStateToneClass(tone: SectionStateTone) {
  if (tone === "success") return "bg-emerald-100 text-emerald-800";
  if (tone === "warning") return "bg-amber-100 text-amber-800";
  if (tone === "danger") return "bg-rose-100 text-rose-800";
  return "bg-zinc-100 text-zinc-700";
}
