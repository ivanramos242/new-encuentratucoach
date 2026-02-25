"use client";

import { useMemo, useState } from "react";
import type { MessageThreadSummaryDto, MessagingRole } from "@/types/messages";
import { ThreadListItem } from "@/components/messages/thread-list-item";

export function ThreadList({
  role,
  threads,
  selectedThreadId,
  onRefresh,
  loading,
}: {
  role: MessagingRole;
  threads: MessageThreadSummaryDto[];
  selectedThreadId?: string | null;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((thread) => {
      const counterpart = thread.viewerRole === "coach" ? thread.clientName : thread.coachName;
      return (
        counterpart.toLowerCase().includes(q) ||
        thread.lastMessagePreview.toLowerCase().includes(q)
      );
    });
  }, [query, threads]);

  return (
    <section className="flex h-[calc(100dvh-10.5rem)] min-h-[28rem] flex-col rounded-2xl border border-black/10 bg-white shadow-sm sm:h-[clamp(34rem,68vh,56rem)] sm:rounded-3xl">
      <div className="border-b border-black/5 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-tight text-zinc-950">Mensajes</h2>
            <p className="text-xs text-zinc-500">{threads.length} conversaciones</p>
          </div>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
            >
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          ) : null}
        </div>
        <label className="mt-3 block">
          <span className="sr-only">Buscar chat</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar chat o contacto..."
            className="w-full rounded-2xl border border-black/10 bg-zinc-50 px-4 py-2.5 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-cyan-400"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2 sm:p-3">
        {filtered.length ? (
          filtered.map((thread) => (
            <ThreadListItem
              key={thread.id}
              role={role}
              thread={thread}
              selected={selectedThreadId === thread.id}
            />
          ))
        ) : (
          <div className="grid h-full min-h-40 place-items-center rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
            No hay conversaciones que coincidan.
          </div>
        )}
      </div>
    </section>
  );
}
