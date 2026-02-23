"use client";

import { useState } from "react";

export function QaQuestionAskForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("sending");
    setMessage("");

    const payload = {
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      topicSlug: String(formData.get("topicSlug") ?? ""),
      isAnonymous: Boolean(formData.get("isAnonymous")),
      honeypot: String(formData.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/qa/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !json.ok) {
        throw new Error(json.message || "No se pudo crear la pregunta");
      }
      setStatus("ok");
      setMessage("Pregunta enviada. En V2 real se publicara y moderara segun reglas.");
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black tracking-tight text-zinc-950">Haz tu pregunta</h2>
      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        Titulo
        <input
          name="title"
          required
          maxLength={180}
          placeholder="Ej: Como elegir un coach de carrera?"
          className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        Pregunta
        <textarea
          name="body"
          required
          rows={5}
          maxLength={4000}
          placeholder="Explica tu situacion en 3-5 lineas para que los coaches puedan ayudarte."
          className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        Tema
        <select
          name="topicSlug"
          defaultValue="elegir-coach"
          className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
        >
          <option value="elegir-coach">Elegir coach</option>
          <option value="precios">Precios</option>
          <option value="modalidad-online">Coaching online</option>
          <option value="certificacion">Certificacion</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="isAnonymous" />
        Publicar como anonimo
      </label>
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {status === "sending" ? "Enviando..." : "Publicar pregunta"}
      </button>
      {message ? (
        <p className={status === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}>{message}</p>
      ) : null}
    </form>
  );
}
