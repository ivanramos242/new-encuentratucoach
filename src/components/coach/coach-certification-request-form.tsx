"use client";

import { useState } from "react";
import { faCircleCheck, faClock, faFileArrowUp, faPaperclip, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type UploadedCertificationDocument = {
  storageKey: string;
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  sizeBytes: number;
};

type LatestCertificationRequest = {
  id: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string | null;
  reviewerNotes?: string | null;
};

export function CoachCertificationRequestForm({
  coachName,
  coachEmail,
  profileUrl,
  locationLabel,
  phone,
  website,
  certifiedStatus,
  latestRequest,
}: {
  coachName: string;
  coachEmail: string;
  profileUrl?: string | null;
  locationLabel?: string | null;
  phone?: string | null;
  website?: string | null;
  certifiedStatus: string;
  latestRequest?: LatestCertificationRequest | null;
}) {
  const [coachNotes, setCoachNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasPendingRequest = latestRequest?.status === "pending";

  async function postJson(url: string, payload: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({ ok: false, message: `Error HTTP ${res.status}` }))) as {
      ok?: boolean;
      message?: string;
      [key: string]: unknown;
    };
    if (!res.ok || !json.ok) {
      throw new Error(typeof json.message === "string" ? json.message : "Error inesperado");
    }
    return json;
  }

  async function uploadCertificationDocument(file: File): Promise<UploadedCertificationDocument> {
    const contentType = (file.type || "").trim() || "application/octet-stream";
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    if (!allowed.has(contentType)) {
      throw new Error(`Formato no permitido: ${file.name}. Solo fotos (JPG/PNG/WEBP) y PDF.`);
    }

    const presign = (await postJson("/api/uploads/presign", {
      scope: "certification_document",
      fileName: file.name,
      contentType,
      sizeBytes: file.size,
    })) as {
      uploadUrl?: string;
      storageKey?: string;
    };

    if (!presign.uploadUrl || !presign.storageKey) {
      throw new Error("No se pudo preparar la subida del archivo.");
    }

    const put = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "content-type": contentType },
      body: file,
    });
    if (!put.ok) throw new Error(`La subida de ${file.name} ha fallado (HTTP ${put.status}).`);

    return {
      storageKey: presign.storageKey,
      fileName: file.name,
      mimeType: contentType as UploadedCertificationDocument["mimeType"],
      sizeBytes: file.size,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasPendingRequest) return;

    setError(null);
    setSuccess(null);

    if (!files.length) {
      setError("Debes subir al menos un archivo (foto o PDF) para enviar la solicitud.");
      return;
    }

    try {
      setPending(true);
      const uploadedDocs: UploadedCertificationDocument[] = [];
      for (const file of files) {
        uploadedDocs.push(await uploadCertificationDocument(file));
      }

      const result = (await postJson("/api/certifications/request", {
        coachNotes,
        documents: uploadedDocs,
      })) as { requestId?: string; reviewEta?: string };

      setSuccess(
        `Solicitud enviada correctamente${result.requestId ? ` (ID ${result.requestId})` : ""}. Revisaremos la documentación en un plazo aproximado de ${result.reviewEta || "5-14 días"}.`,
      );
      setFiles([]);
      setCoachNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la solicitud.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Solicitud de certificación</h2>
            <p className="mt-1 text-sm text-zinc-700">
              Sube certificados (fotos o PDF). El equipo revisará la documentación y responderá en 5-14 días.
            </p>
          </div>
          <StatusPill status={latestRequest?.status ?? "none"} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoItem label="Coach" value={coachName} />
          <InfoItem label="Email" value={coachEmail} />
          <InfoItem label="Ubicación" value={locationLabel || "No indicada"} />
          <InfoItem label="Teléfono" value={phone || "No indicado"} />
          <InfoItem label="Web" value={website || "No indicada"} />
          <InfoItem label="Estado actual de distintivo" value={certifiedStatus} />
        </div>

        {profileUrl ? (
          <p className="mt-3 text-sm text-zinc-600">
            Perfil público:{" "}
            <a href={profileUrl} target="_blank" rel="noreferrer noopener" className="font-semibold text-cyan-700 hover:text-cyan-800">
              {profileUrl}
            </a>
          </p>
        ) : null}
      </section>

      {latestRequest ? (
        <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black tracking-tight text-zinc-950">Última solicitud</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <InfoItem label="ID solicitud" value={latestRequest.id} />
            <InfoItem label="Estado" value={latestRequest.status} />
            <InfoItem label="Enviada" value={formatDate(latestRequest.submittedAt)} />
            <InfoItem label="Revisada" value={latestRequest.reviewedAt ? formatDate(latestRequest.reviewedAt) : "Pendiente"} />
          </div>
          {latestRequest.reviewerNotes ? (
            <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">Notas de revisión</p>
              <p className="mt-2 whitespace-pre-wrap">{latestRequest.reviewerNotes}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
        {hasPendingRequest ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Ya tienes una solicitud pendiente.</p>
            <p className="mt-1">
              Estamos revisando tu documentación. El plazo estimado es de 5 a 14 días. Cuando se resuelva, podrás enviar
              una nueva solicitud si fuese necesario.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-900" htmlFor="cert-files">
              Documentación (fotos o PDF)
            </label>
            <input
              id="cert-files"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={pending || hasPendingRequest}
              onChange={(e) => setFiles(Array.from(e.currentTarget.files ?? []))}
              className="block w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <p className="mt-2 text-xs text-zinc-600">
              Formatos permitidos: JPG, PNG, WEBP y PDF. Puedes subir varios archivos.
            </p>
          </div>

          {files.length ? (
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">
                <FontAwesomeIcon icon={faPaperclip} className="mr-2 h-4 w-4 text-zinc-500" />
                Archivos seleccionados ({files.length})
              </p>
              <ul className="mt-2 space-y-2 text-sm text-zinc-700">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2">
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-zinc-500">{prettySize(file.size)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-900" htmlFor="coach-notes">
              Mensaje para revisión (opcional)
            </label>
            <textarea
              id="coach-notes"
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.currentTarget.value)}
              disabled={pending || hasPendingRequest}
              rows={5}
              maxLength={3000}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
              placeholder="Añade contexto sobre la formación, entidad certificadora o cualquier detalle útil para la revisión."
            />
            <p className="mt-1 text-xs text-zinc-500">{coachNotes.length}/3000</p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2 h-4 w-4" />
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <FontAwesomeIcon icon={faCircleCheck} className="mr-2 h-4 w-4" />
              {success}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending || hasPendingRequest}
              className="inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FontAwesomeIcon icon={pending ? faClock : faFileArrowUp} className="mr-2 h-4 w-4" />
              {pending ? "Enviando solicitud..." : "Enviar solicitud de certificación"}
            </button>
            <p className="text-xs text-zinc-600">La revisión manual suele resolverse en 5-14 días.</p>
          </div>
        </form>
      </section>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "pending" | "approved" | "rejected" | "none" }) {
  if (status === "approved") {
    return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Aprobada</span>;
  }
  if (status === "rejected") {
    return <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">Rechazada</span>;
  }
  if (status === "pending") {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Pendiente</span>;
  }
  return <span className="rounded-full border border-black/10 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">Sin solicitud</span>;
}

function prettySize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}
