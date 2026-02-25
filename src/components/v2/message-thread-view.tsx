import Link from "next/link";
import type { MessageThread } from "@/types/v2";

export function MessageThreadView({
  role,
  thread,
}: {
  role: "coach" | "client";
  thread: MessageThread;
}) {
  const counterpart = role === "coach" ? thread.clientName : thread.coachName;
  const backHref = role === "coach" ? "/mi-cuenta/coach/mensajes" : "/mi-cuenta/cliente/mensajes";
  const canReply = role === "client" || (role === "coach" && thread.coachMembershipActive);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
          <div>
            <p className="text-sm font-semibold text-zinc-500">{role === "coach" ? "Conversación con cliente" : "Conversación con coach"}</p>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">{counterpart}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Hilo único por cliente + coach · polling recomendado cada 5 minutos · 1 adjunto por mensaje (V2)
            </p>
          </div>
          <Link href={backHref} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900">
            Volver al inbox
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {thread.messages.map((message) => {
            const isOwn = (role === "coach" && message.senderType === "coach") || (role === "client" && message.senderType === "client");
            return (
              <article
                key={message.id}
                className={`rounded-2xl border p-4 ${
                  isOwn ? "border-cyan-200 bg-cyan-50" : "border-black/10 bg-zinc-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-zinc-900">{message.senderLabel}</p>
                  <p className="text-xs text-zinc-500">{new Date(message.createdAt).toLocaleString("es-ES")}</p>
                </div>
                {message.body ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-700">{message.body}</p> : null}
                {message.attachment ? (
                  <div className="mt-3 rounded-xl border border-black/10 bg-white p-3">
                    <p className="text-sm font-semibold text-zinc-900">{message.attachment.fileName}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {message.attachment.mimeType} · {(message.attachment.sizeBytes / 1024).toFixed(0)} KB · {message.attachment.status}
                    </p>
                    <button className="mt-2 rounded-lg border border-black/10 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800">
                      Abrir adjunto (URL firmada mock)
                    </button>
                  </div>
                ) : null}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">ID: {message.id}</span>
                  <span className={message.readByOtherSide ? "text-emerald-700" : "text-zinc-500"}>
                    {message.readByOtherSide ? "Leído" : "Pendiente de leer"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black tracking-tight text-zinc-950">Estado del hilo</h3>
          <div className="mt-4 grid gap-2 text-sm text-zinc-700">
            <p>Estado: <strong className="text-zinc-900">{thread.status}</strong></p>
            <p>Coach: <strong className="text-zinc-900">{thread.coachName}</strong></p>
            <p>Membresía coach: <strong className="text-zinc-900">{thread.coachMembershipActive ? "Activa" : "Inactiva"}</strong></p>
            {!thread.coachMembershipActive ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
                El coach puede leer el historial, pero no responder mientras la membresía siga inactiva.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black tracking-tight text-zinc-950">Responder (mock UI)</h3>
          <p className="mt-2 text-sm text-zinc-700">
            En V2 real esta vista enviará mensajes a <code>/api/messages/threads/{thread.id}/messages</code> y hará polling cada 5 minutos.
          </p>
          <div className="mt-4 grid gap-3">
            <textarea
              rows={5}
              disabled={!canReply}
              placeholder={canReply ? "Escribe tu respuesta..." : "No puedes responder mientras la membresía esté inactiva."}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none disabled:bg-zinc-100"
            />
            <button
              disabled={!canReply}
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Enviar mensaje
            </button>
            <p className="text-xs text-zinc-500">Permitido: JPG/PNG/WebP/PDF hasta 5 MB, 1 adjunto por mensaje.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
