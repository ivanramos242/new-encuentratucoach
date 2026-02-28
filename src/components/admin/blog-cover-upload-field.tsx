"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";

type UploadScope = "blog_cover";

async function postJson(url: string, payload: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({ ok: false, message: `Error ${res.status}` }));
  if (!res.ok || !json.ok) throw new Error(json.message || "Error inesperado");
  return json;
}

async function uploadViaPresign(input: { file: File; scope: UploadScope }) {
  const presign = (await postJson("/api/uploads/presign", {
    scope: input.scope,
    fileName: input.file.name,
    contentType: input.file.type,
    sizeBytes: input.file.size,
  })) as {
    uploadUrl?: string;
    publicObjectUrl?: string | null;
  };

  if (!presign.uploadUrl) throw new Error("No se recibio URL de subida");

  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "content-type": input.file.type || "application/octet-stream" },
    body: input.file,
  });
  if (!put.ok) throw new Error(`La subida ha fallado (HTTP ${put.status})`);

  const finalUrl = presign.publicObjectUrl || presign.uploadUrl.split("?")[0];
  if (!finalUrl) throw new Error("No se pudo resolver la URL final");
  return finalUrl;
}

async function deleteUploadedObject(url: string) {
  await postJson("/api/uploads/delete", { url });
}

export function BlogCoverUploadField({ initialUrl = "" }: { initialUrl?: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [coverUrl, setCoverUrl] = useState(initialUrl);
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      setStatus(null);
      try {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("La imagen supera 10MB.");
        }

        const url = await uploadViaPresign({ file, scope: "blog_cover" });
        setCoverUrl(url);
        setStatus({ type: "ok", text: "Portada subida correctamente." });
      } catch (error) {
        setStatus({
          type: "error",
          text: error instanceof Error ? error.message : "No se pudo subir la portada.",
        });
      } finally {
        if (event.target) event.target.value = "";
      }
    });
  }

  function clearCover() {
    const old = coverUrl;
    if (!old) return;

    startTransition(async () => {
      setStatus(null);
      try {
        await deleteUploadedObject(old);
      } catch {
        // If the file is already gone, we still allow clearing the field.
      } finally {
        setCoverUrl("");
        setStatus({ type: "ok", text: "Portada eliminada." });
      }
    });
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name="coverImageUrl" value={coverUrl} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
        >
          {isPending ? "Subiendo..." : "Subir portada"}
        </button>
        {coverUrl ? (
          <button
            type="button"
            onClick={clearCover}
            disabled={isPending}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
          >
            Quitar portada
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onSelectFile}
        className="hidden"
      />
      {coverUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-black/10 bg-zinc-100">
          <Image src={coverUrl} alt="Portada del articulo" fill className="object-cover" />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-4 text-sm text-zinc-600">
          No hay portada subida. Recomendado: 1600x900 (16:9).
        </div>
      )}
      {status ? (
        <p className={`text-sm ${status.type === "error" ? "text-rose-700" : "text-emerald-700"}`}>{status.text}</p>
      ) : null}
      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        O pega una URL manual
        <input
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-xl border border-black/10 px-3 py-2 outline-none focus:border-cyan-400"
        />
      </label>
    </div>
  );
}
