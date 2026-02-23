"use client";

import { useState } from "react";

export function ContactCoachForm({ coachId, coachName }: { coachId: string; coachName: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/contact/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          coachId,
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          message: String(formData.get("message") ?? ""),
          honeypot: String(formData.get("website") ?? ""),
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.message || "Error al enviar");

      setStatus("success");
      setMessage("Mensaje enviado correctamente (relay V1 simulado).");
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo enviar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wide text-zinc-500">Enviar Mensaje</h3>
        <p className="mt-1 text-sm text-zinc-700">Contacta con {coachName} desde la plataforma.</p>
      </div>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        Nombre
        <input name="name" required className="rounded-xl border border-black/10 px-3 py-2 focus:border-cyan-400 outline-none" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-xl border border-black/10 px-3 py-2 focus:border-cyan-400 outline-none"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        Mensaje
        <textarea
          name="message"
          rows={4}
          required
          placeholder="Mi objetivo es X. Ahora estoy en Y. Mi bloqueo principal es Z..."
          className="rounded-xl border border-black/10 px-3 py-2 focus:border-cyan-400 outline-none"
        />
      </label>

      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === "sending" ? "Enviando..." : "Enviar mensaje"}
      </button>

      {message ? (
        <p className={status === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}>{message}</p>
      ) : null}
    </form>
  );
}
