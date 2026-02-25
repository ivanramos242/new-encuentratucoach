"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperclip, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { AttachmentPreview, type PendingAttachmentPreview } from "@/components/messages/attachment-preview";
import { AudioRecorder, type RecordedAudio } from "@/components/messages/audio-recorder";
import type { ComposerAttachmentInput } from "@/components/messages/use-send-queue";
import type { MessageServerHints } from "@/types/messages";

function attachmentTypeFromFile(file: File): "image" | "pdf" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  return null;
}

function normalizeMime(mimeType: string) {
  return mimeType.split(";")[0]?.trim().toLowerCase() || mimeType.trim().toLowerCase();
}

export function ChatComposer({
  canReply,
  pendingCount,
  serverHints,
  onSend,
}: {
  canReply: boolean;
  pendingCount: number;
  serverHints?: MessageServerHints | null;
  onSend: (input: { body: string; attachment?: ComposerAttachmentInput }) => void;
}) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<ComposerAttachmentInput | null>(null);
  const [preview, setPreview] = useState<PendingAttachmentPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (preview?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(preview.previewUrl);
    };
  }, [preview?.previewUrl]);

  function setAttachmentState(next: ComposerAttachmentInput | null, nextPreview: PendingAttachmentPreview | null) {
    if (preview?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(preview.previewUrl);
    setAttachment(next);
    setPreview(nextPreview);
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    const type = attachmentTypeFromFile(file);
    if (!type) {
      setError("Solo se permiten imágenes o PDF en adjuntos.");
      event.target.value = "";
      return;
    }
    const normalized = normalizeMime(file.type || (type === "pdf" ? "application/pdf" : "image/jpeg"));
    const previewUrl = type === "image" ? URL.createObjectURL(file) : undefined;
    setAttachmentState(
      {
        blob: file,
        type,
        fileName: file.name,
        mimeType: normalized,
        sizeBytes: file.size,
        previewUrl,
      },
      {
        type,
        fileName: file.name,
        mimeType: normalized,
        sizeBytes: file.size,
        previewUrl,
      },
    );
    event.target.value = "";
  }

  function onRecorded(audio: RecordedAudio) {
    setError(null);
    const normalized = normalizeMime(audio.mimeType);
    setAttachmentState(
      {
        blob: audio.blob,
        type: "audio",
        fileName: audio.fileName,
        mimeType: normalized,
        sizeBytes: audio.blob.size,
        durationMs: audio.durationMs,
        previewUrl: audio.previewUrl,
      },
      {
        type: "audio",
        fileName: audio.fileName,
        mimeType: normalized,
        sizeBytes: audio.blob.size,
        durationMs: audio.durationMs,
        previewUrl: audio.previewUrl,
      },
    );
  }

  function submit() {
    if (!canReply) return;
    const trimmed = text.trim();
    if (!trimmed && !attachment) {
      setError("Escribe un mensaje o añade un adjunto.");
      return;
    }
    onSend({ body: trimmed, attachment: attachment ?? undefined });
    setText("");
    setError(null);
    setAttachmentState(null, null);
  }

  return (
    <div className="sticky bottom-0 border-t border-black/5 bg-white/95 p-3 backdrop-blur">
      {preview ? (
        <div className="mb-2">
          <AttachmentPreview attachment={preview} onRemove={() => setAttachmentState(null, null)} />
        </div>
      ) : null}

      <div className="flex items-end gap-2 sm:gap-2.5">
        <button
          type="button"
          disabled={!canReply}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Adjuntar archivo"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-zinc-700 disabled:opacity-50"
          title="Adjuntar archivo"
        >
          <FontAwesomeIcon icon={faPaperclip} className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileChange}
          accept="image/*,application/pdf"
          className="hidden"
        />

        <div className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-zinc-50 px-3 py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            disabled={!canReply}
            placeholder={canReply ? "Escribe un mensaje..." : "No puedes responder en este hilo."}
            className="max-h-28 min-h-6 w-full resize-none bg-transparent text-base sm:text-sm outline-none placeholder:text-zinc-400"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
          />
        </div>

        <AudioRecorder disabled={!canReply || Boolean(attachment)} onRecorded={onRecorded} />

        <button
          type="button"
          onClick={submit}
          disabled={!canReply}
          aria-label="Enviar mensaje"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white shadow-sm disabled:opacity-50"
          title="Enviar mensaje"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-end gap-3">
        {pendingCount > 0 ? (
          <p className="text-xs font-semibold text-cyan-700">
            {pendingCount} pendiente{pendingCount > 1 ? "s" : ""} en cola
          </p>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
