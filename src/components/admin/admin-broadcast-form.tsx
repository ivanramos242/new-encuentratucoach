"use client";

import { useState } from "react";

type BroadcastAudience = "coaches" | "clients" | "both";

type SubmitState = "idle" | "sending" | "success" | "error";

type BroadcastResponse = {
  ok?: boolean;
  message?: string;
  processed?: number;
  emailQueued?: number;
  inAppCreated?: number;
  skippedByPreference?: number;
};

export function AdminBroadcastForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setState("sending");
    setFeedback("");

    try {
      const audience = String(data.get("audience") ?? "") as BroadcastAudience;
      const subject = String(data.get("subject") ?? "");
      const message = String(data.get("message") ?? "");
      const includeInApp = data.get("includeInApp") === "on";

      const response = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          audience,
          subject,
          message,
          includeInApp,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as BroadcastResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "No se pudo enviar el comunicado.");
      }

      setState("success");
      setFeedback(
        `Enviado: ${payload.processed ?? 0} usuarios procesados · ${payload.emailQueued ?? 0} emails en cola · ${payload.skippedByPreference ?? 0} omitidos por preferencia.`,
      );
      form.reset();
    } catch (error) {
      setState("error");
      setFeedback(error instanceof Error ? error.message : "No se pudo enviar el comunicado.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-black tracking-tight text-zinc-950">Enviar correo masivo</h2>
        <p className="mt-1 text-sm text-zinc-700">
          Segmenta por coaches, clientes o ambos. El sistema respeta preferencias individuales de email.
        </p>
      </div>

      <label className="grid gap-1 text-sm font-semibold text-zinc-800">
        Audiencia
        <select
          name="audience"
          required
          defaultValue="coaches"
          className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-cyan-400"
        >
          <option value="coaches">Coaches</option>
          <option value="clients">Clientes</option>
          <option value="both">Ambos</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm font-semibold text-zinc-800">
        Asunto
        <input
          name="subject"
          required
          minLength={3}
          maxLength={180}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          placeholder="Actualizacion de plataforma"
        />
      </label>

      <label className="grid gap-1 text-sm font-semibold text-zinc-800">
        Mensaje
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={8000}
          rows={6}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          placeholder="Escribe aqui el comunicado..."
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="includeInApp" defaultChecked />
        Crear tambien notificacion in-app
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "sending" ? "Enviando..." : "Enviar comunicado"}
        </button>
      </div>

      {feedback ? <p className={state === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}>{feedback}</p> : null}
    </form>
  );
}

