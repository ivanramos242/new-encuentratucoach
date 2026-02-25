"use client";

import Link from "next/link";
import type { MessageThreadSummaryDto, MessagingRole } from "@/types/messages";
import { cn } from "@/lib/utils";

function formatTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function ThreadListItem({
  role,
  thread,
  selected,
}: {
  role: MessagingRole;
  thread: MessageThreadSummaryDto;
  selected?: boolean;
}) {
  const unread = role === "coach" ? thread.unreadForCoach : thread.unreadForClient;
  const name = role === "coach" ? thread.clientName : thread.coachName;
  const href = role === "coach" ? `/mi-cuenta/coach/mensajes/${thread.id}` : `/mi-cuenta/cliente/mensajes/${thread.id}`;

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border p-3 transition",
        selected
          ? "border-cyan-300 bg-cyan-50 shadow-sm"
          : "border-black/5 bg-white hover:border-black/10 hover:bg-zinc-50",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cyan-100 to-emerald-100 text-sm font-black text-zinc-800">
          {name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-bold text-zinc-900">{name}</p>
            <p className="shrink-0 text-[11px] text-zinc-500">{formatTime(thread.lastMessageAt)}</p>
          </div>
          <p className="mt-1 truncate text-xs text-zinc-600">{thread.lastMessagePreview}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] text-zinc-500">
              {role === "coach" ? "Cliente" : thread.coachMembershipActive ? "Coach activo" : "Coach inactivo"}
            </span>
            {unread > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

