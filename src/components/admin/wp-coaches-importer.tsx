"use client";

import { useState } from "react";

type ImportMode = "dry-run" | "commit";

type ImportResponse = {
  ok: boolean;
  message?: string;
  stdout?: string;
  stderr?: string;
  summary?: Record<string, unknown> | null;
  elapsedMs?: number;
  exitCode?: number;
};

export function WpCoachesImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [mediaFrom, setMediaFrom] = useState("https://encuentratucoach.es");
  const [mediaTo, setMediaTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(mode: ImportMode) {
    if (!file) {
      setError("Selecciona un archivo JSON antes de continuar.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("mode", mode);
      if (mediaFrom.trim()) form.set("mediaFrom", mediaFrom.trim());
      if (mediaTo.trim()) form.set("mediaTo", mediaTo.trim());

      const response = await fetch("/api/admin/import/coaches", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as ImportResponse;
      setResult(data);
      if (!response.ok || !data.ok) {
        setError(data.message || "La importación ha fallado.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo contactar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-black tracking-tight text-zinc-950">Importar coaches desde JSON (WordPress)</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          Sube el export JSON y ejecuta primero un <strong>dry-run</strong>. Cuando el resumen sea correcto, lanza
          la importación real.
        </p>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-zinc-900">
          Archivo JSON
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-900">
          Reemplazar prefijo de media (opcional, origen)
          <input
            type="text"
            value={mediaFrom}
            onChange={(e) => setMediaFrom(e.target.value)}
            placeholder="https://encuentratucoach.es"
            className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-900">
          Reemplazar prefijo de media (opcional, destino)
          <input
            type="text"
            value={mediaTo}
            onChange={(e) => setMediaTo(e.target.value)}
            placeholder="https://padel-minio.obdyzx.easypanel.host/etc-public/wp-import"
            className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => submit("dry-run")}
          className="rounded-xl border border-black px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {isSubmitting ? "Procesando..." : "Dry-run"}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            if (!window.confirm("¿Seguro que quieres importar coaches en la base de datos?")) return;
            void submit("commit");
          }}
          className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {isSubmitting ? "Importando..." : "Importar (commit)"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">
            <div>
              <strong>Resultado:</strong> {result.ok ? "OK" : "Error"}
            </div>
            {typeof result.elapsedMs === "number" ? (
              <div>
                <strong>Duración:</strong> {result.elapsedMs} ms
              </div>
            ) : null}
            {typeof result.exitCode === "number" ? (
              <div>
                <strong>Exit code:</strong> {result.exitCode}
              </div>
            ) : null}
            {result.message ? (
              <div>
                <strong>Mensaje:</strong> {result.message}
              </div>
            ) : null}
          </div>

          {result.summary ? (
            <div>
              <h3 className="mb-2 text-sm font-bold text-zinc-900">Resumen</h3>
              <pre className="max-h-80 overflow-auto rounded-xl border border-black/10 bg-black p-4 text-xs text-white">
                {JSON.stringify(result.summary, null, 2)}
              </pre>
            </div>
          ) : null}

          {result.stdout ? (
            <div>
              <h3 className="mb-2 text-sm font-bold text-zinc-900">Salida (stdout)</h3>
              <pre className="max-h-80 overflow-auto rounded-xl border border-black/10 bg-zinc-950 p-4 text-xs text-zinc-100">
                {result.stdout}
              </pre>
            </div>
          ) : null}

          {result.stderr ? (
            <div>
              <h3 className="mb-2 text-sm font-bold text-zinc-900">Errores (stderr)</h3>
              <pre className="max-h-80 overflow-auto rounded-xl border border-red-200 bg-red-950 p-4 text-xs text-red-100">
                {result.stderr}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

