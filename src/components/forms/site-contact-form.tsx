"use client";

import { useState } from "react";

type SubmitState = "idle" | "sending" | "success" | "error";

type ContactReason = "soporte" | "cuenta" | "membresia" | "certificacion" | "colaboracion";

const CONTACT_REASON_OPTIONS: Array<{ value: ContactReason; label: string }> = [
  { value: "soporte", label: "Soporte técnico" },
  { value: "cuenta", label: "Cuenta y acceso" },
  { value: "membresia", label: "Membresía" },
  { value: "certificacion", label: "Certificación" },
  { value: "colaboracion", label: "Colaboración" },
];

export function SiteContactForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/contact/site", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          reason: String(formData.get("reason") ?? ""),
          relatedUrl: String(formData.get("relatedUrl") ?? ""),
          message: String(formData.get("message") ?? ""),
          privacyAccepted: formData.get("privacyAccepted") === "on",
          honeypot: String(formData.get("website") ?? ""),
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "No se pudo enviar el formulario.");
      }

      setState("success");
      setMessage(payload.message || "Formulario enviado correctamente.");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "No se pudo enviar el formulario.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm" aria-label="Formulario de contacto">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Nombre (opcional)
          <input
            name="name"
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
            placeholder="Tu nombre"
            maxLength={120}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
            placeholder="tu@email.com"
            maxLength={320}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          Motivo
          <select
            name="reason"
            required
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            {CONTACT_REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-800">
          URL relacionada (opcional)
          <input
            name="relatedUrl"
            className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
            placeholder="https://encuentratucoach.es/..."
            maxLength={500}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        Mensaje
        <textarea
          name="message"
          rows={6}
          required
          minLength={10}
          maxLength={5000}
          className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
          placeholder="Qué intentabas hacer, qué pasó y qué esperabas que ocurriera."
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="privacyAccepted" className="mt-1" required />
        <span>He leído la política de privacidad y acepto el tratamiento de datos para responder mi consulta.</span>
      </label>

      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "sending" ? "Enviando..." : "Enviar formulario"}
        </button>
      </div>

      {message ? (
        <p className={state === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}>{message}</p>
      ) : null}
    </form>
  );
}
