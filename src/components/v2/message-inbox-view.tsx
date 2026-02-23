import Link from "next/link";
import type { MessageThread } from "@/types/v2";

export function MessageInboxView({
  role,
  threads,
}: {
  role: "coach" | "client";
  threads: MessageThread[];
}) {
  const threadBase = role === "coach" ? "/mi-cuenta/coach/mensajes" : "/mi-cuenta/cliente/mensajes";

  return (
    <div className="grid gap-4">
      {threads.map((thread) => {
        const unread = role === "coach" ? thread.unreadForCoach : thread.unreadForClient;
        const counterpart = role === "coach" ? thread.clientName : thread.coachName;
        return (
          <Link
            key={thread.id}
            href={`${threadBase}/${thread.id}`}
            className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-500">{role === "coach" ? "Cliente" : "Coach"}</p>
                <h2 className="text-lg font-black tracking-tight text-zinc-950">{counterpart}</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {role === "coach" ? `Coach asociado: ${thread.coachName}` : `Perfil: ${thread.coachName}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs">
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${
                    thread.coachMembershipActive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {thread.coachMembershipActive ? "Coach activo" : "Coach inactivo (solo lectura)"}
                </span>
                <span className="text-zinc-500">{new Date(thread.lastMessageAt).toLocaleString("es-ES")}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-black/5 bg-zinc-50 p-3">
              <p className="line-clamp-2 text-sm text-zinc-700">
                {thread.messages.at(-1)?.body || "Conversacion iniciada. Envía tu primer mensaje."}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                <span className="rounded-full bg-white px-2.5 py-1">{thread.messages.length} mensajes</span>
                <span className="rounded-full bg-white px-2.5 py-1">Estado: {thread.status}</span>
              </div>
              {unread > 0 ? (
                <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                  {unread} sin leer
                </span>
              ) : (
                <span className="text-xs text-zinc-500">Sin pendientes</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

