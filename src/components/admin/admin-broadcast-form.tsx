"use client";

import { useEffect, useMemo, useState } from "react";

type BroadcastAudience = "coaches" | "clients" | "both";
type BroadcastMode = "segment" | "selected";
type SubmitState = "idle" | "sending" | "success" | "error";

type BroadcastResponse = {
  ok?: boolean;
  message?: string;
  processed?: number;
  emailQueued?: number;
  inAppCreated?: number;
  skippedByPreference?: number;
};

type Recipient = {
  id: string;
  email: string;
  displayName: string | null;
  segment: "coaches" | "clients";
  role: "admin" | "coach" | "client";
  createdAt: string;
};

type RecipientsResponse = {
  ok?: boolean;
  recipients?: Recipient[];
  message?: string;
};

function recipientLabel(recipient: Recipient) {
  return recipient.displayName?.trim() || recipient.email;
}

export function AdminBroadcastForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState("");
  const [mode, setMode] = useState<BroadcastMode>("segment");
  const [search, setSearch] = useState("");
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const filteredRecipients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return recipients;
    return recipients.filter((item) => {
      const haystack = `${item.displayName || ""} ${item.email}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [recipients, search]);

  const selectedSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);

  useEffect(() => {
    let canceled = false;
    const timeout = window.setTimeout(async () => {
      try {
        setLoadingRecipients(true);
        const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}&limit=300` : "?limit=300";
        const response = await fetch(`/api/admin/notifications/recipients${query}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as RecipientsResponse;
        if (!response.ok || !payload.ok) {
          throw new Error(payload.message || "No se pudieron cargar destinatarios.");
        }
        if (!canceled) {
          setRecipients(payload.recipients ?? []);
          setSelectedUserIds((prev) => prev.filter((id) => (payload.recipients ?? []).some((item) => item.id === id)));
        }
      } catch (error) {
        if (!canceled) {
          setFeedback(error instanceof Error ? error.message : "No se pudieron cargar destinatarios.");
          setState("error");
        }
      } finally {
        if (!canceled) setLoadingRecipients(false);
      }
    }, 250);

    return () => {
      canceled = true;
      window.clearTimeout(timeout);
    };
  }, [search]);

  function toggleUser(userId: string, enabled: boolean) {
    setSelectedUserIds((prev) => {
      if (enabled) {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      }
      return prev.filter((id) => id !== userId);
    });
  }

  function clearSelection() {
    setSelectedUserIds([]);
  }

  function selectFiltered() {
    setSelectedUserIds((prev) => {
      const merged = new Set(prev);
      for (const item of filteredRecipients) merged.add(item.id);
      return [...merged];
    });
  }

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

      if (mode === "selected" && selectedUserIds.length === 0) {
        throw new Error("Selecciona al menos un destinatario en modo personalizado.");
      }

      const response = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          audience: mode === "segment" ? audience : undefined,
          selectedUserIds: mode === "selected" ? selectedUserIds : [],
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
        `Enviado: ${payload.processed ?? 0} usuarios procesados | ${payload.emailQueued ?? 0} emails en cola | ${payload.skippedByPreference ?? 0} omitidos por preferencia.`,
      );
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
          Puedes enviar por segmento (coaches/clientes) o seleccionar usuarios concretos de forma personalizada.
        </p>
      </div>

      <label className="grid gap-1 text-sm font-semibold text-zinc-800">
        Modo de envio
        <select
          value={mode}
          onChange={(event) => setMode(event.currentTarget.value as BroadcastMode)}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-cyan-400"
        >
          <option value="segment">Segmentado (coaches/clientes/ambos)</option>
          <option value="selected">Personalizado (usuarios concretos)</option>
        </select>
      </label>

      {mode === "segment" ? (
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
      ) : (
        <div className="grid gap-3 rounded-xl border border-black/10 bg-zinc-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-900">Destinatarios personalizados</p>
            <p className="text-xs text-zinc-600">
              Seleccionados: <strong>{selectedUserIds.length}</strong>
            </p>
          </div>

          <label className="grid gap-1 text-sm font-semibold text-zinc-800">
            Buscar usuario
            <input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400"
              placeholder="Nombre o email"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectFiltered}
              className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Seleccionar filtrados
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Limpiar seleccion
            </button>
            {loadingRecipients ? <span className="text-xs text-zinc-500">Cargando...</span> : null}
          </div>

          <div className="max-h-64 overflow-auto rounded-xl border border-black/10 bg-white">
            {filteredRecipients.length ? (
              <div className="grid gap-2 p-2">
                {filteredRecipients.map((recipient) => (
                  <label key={recipient.id} className="flex items-start gap-2 rounded-lg border border-black/5 p-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(recipient.id)}
                      onChange={(event) => toggleUser(recipient.id, event.currentTarget.checked)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-zinc-900">{recipientLabel(recipient)}</span>
                      <span className="block truncate text-xs text-zinc-600">
                        {recipient.email} | {recipient.segment === "coaches" ? "Coach" : "Cliente"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="p-3 text-sm text-zinc-600">No hay resultados para ese filtro.</p>
            )}
          </div>
        </div>
      )}

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


