"use client";

import { useEffect, useMemo, useState } from "react";

type PreferenceItem = {
  id: string;
  type: string;
  channel: "in_app" | "email";
  enabled: boolean;
  digestMode: string;
  group?: string;
  label?: string;
  description?: string;
};

type PreferenceRow = {
  type: string;
  group: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
};

type PreferencesResponse = {
  ok?: boolean;
  message?: string;
  preferences?: PreferenceItem[];
};

function rowsFromPreferences(items: PreferenceItem[]) {
  const map = new Map<string, PreferenceRow>();
  for (const item of items) {
    const existing = map.get(item.type) ?? {
      type: item.type,
      group: item.group || "Sistema",
      label: item.label || item.type,
      description: item.description || "",
      inApp: false,
      email: false,
    };
    if (item.channel === "in_app") existing.inApp = item.enabled;
    if (item.channel === "email") existing.email = item.enabled;
    if (item.group) existing.group = item.group;
    if (item.label) existing.label = item.label;
    if (item.description) existing.description = item.description;
    map.set(item.type, existing);
  }
  return [...map.values()].sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label));
}

export function AccountNotificationPreferences() {
  const [rows, setRows] = useState<PreferenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const groupedRows = useMemo(() => {
    const map = new Map<string, PreferenceRow[]>();
    for (const row of rows) {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notification-preferences", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as PreferencesResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.message || "No se pudieron cargar las preferencias.");
      setRows(rowsFromPreferences(payload.preferences ?? []));
      setFeedback("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las preferencias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function updateRow(type: string, channel: "in_app" | "email", enabled: boolean) {
    setRows((prev) =>
      prev.map((row) =>
        row.type === type
          ? {
              ...row,
              ...(channel === "in_app" ? { inApp: enabled } : { email: enabled }),
            }
          : row,
      ),
    );
  }

  async function save() {
    setSaving(true);
    setFeedback("");
    setError("");
    try {
      const items = rows.flatMap((row) => [
        { type: row.type, channel: "in_app" as const, enabled: row.inApp },
        { type: row.type, channel: "email" as const, enabled: row.email },
      ]);
      const response = await fetch("/api/notification-preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const payload = (await response.json().catch(() => ({}))) as PreferencesResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.message || "No se pudieron guardar las preferencias.");
      setRows(rowsFromPreferences(payload.preferences ?? []));
      setFeedback("Preferencias actualizadas.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudieron guardar las preferencias.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Preferencias de notificaciones</h2>
          <p className="mt-1 text-sm text-zinc-700">
            Elige que notificaciones quieres en la app y cuales quieres tambien por email.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={loading || saving}
          className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {loading ? <p className="text-sm text-zinc-600">Cargando preferencias...</p> : null}
      {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        <div className="space-y-5">
          {groupedRows.map(([group, groupItems]) => (
            <div key={group} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{group}</p>
              <div className="mt-3 grid gap-3">
                {groupItems.map((row) => (
                  <article key={row.type} className="rounded-xl border border-black/10 bg-white p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-[640px]">
                        <p className="text-sm font-semibold text-zinc-900">{row.label}</p>
                        <p className="mt-1 text-xs text-zinc-600">{row.description}</p>
                      </div>
                      <div className="grid gap-2 text-xs">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={row.inApp}
                            onChange={(event) => updateRow(row.type, "in_app", event.currentTarget.checked)}
                          />
                          In-app
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={row.email}
                            onChange={(event) => updateRow(row.type, "email", event.currentTarget.checked)}
                          />
                          Email
                        </label>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

