"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUser, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import type { MessageThreadDetailDto, MessagingRole } from "@/types/messages";

export function ChatHeader({
  inboxRole,
  viewerRole,
  thread,
  onDeleteChat,
  deleting,
}: {
  inboxRole: MessagingRole;
  viewerRole: MessagingRole;
  thread: MessageThreadDetailDto;
  onDeleteChat?: () => void;
  deleting?: boolean;
}) {
  const counterpart = viewerRole === "coach" ? thread.clientName : thread.coachName;
  const backHref = inboxRole === "coach" ? "/mi-cuenta/coach/mensajes" : "/mi-cuenta/cliente/mensajes";

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-white/95 px-3 py-3 backdrop-blur sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href={backHref}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-700 md:hidden"
          aria-label="Volver al inbox"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
        </Link>

        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-100 to-emerald-100 text-sm font-black text-zinc-800">
          {counterpart
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0])
            .join("")
            .toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-zinc-950">{counterpart}</p>
          <p className="truncate text-xs text-zinc-500">
            {viewerRole === "client"
              ? thread.coachMembershipActive
                ? "Coach disponible"
                : "Coach inactivo (solo lectura)"
              : "Conversación privada"}
          </p>
        </div>

        {viewerRole === "client" ? (
          <Link
            href={`/coaches/${thread.coachSlug}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-700 hover:bg-zinc-50"
            aria-label="Ver perfil del coach"
            title="Ver perfil del coach"
          >
            <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
          </Link>
        ) : null}

        {onDeleteChat ? (
          <button
            type="button"
            onClick={onDeleteChat}
            disabled={deleting}
            aria-label="Borrar chat"
            title="Borrar chat"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </header>
  );
}
