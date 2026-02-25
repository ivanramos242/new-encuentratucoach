"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import type { AttachmentType } from "@/types/messages";

export type PendingAttachmentPreview = {
  type: AttachmentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl?: string;
  durationMs?: number;
};

export function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: PendingAttachmentPreview | null;
  onRemove?: () => void;
}) {
  if (!attachment) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {attachment.fileName}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {(attachment.sizeBytes / 1024).toFixed(0)} KB · {attachment.mimeType}
            {attachment.durationMs ? ` · ${(attachment.durationMs / 1000).toFixed(1)}s` : ""}
          </p>
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-zinc-700"
            aria-label="Quitar adjunto"
          >
            <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      {attachment.type === "image" && attachment.previewUrl ? (
        <img src={attachment.previewUrl} alt="" className="mt-2 max-h-44 rounded-xl border border-black/10 object-cover" />
      ) : null}

      {attachment.type === "audio" && attachment.previewUrl ? (
        <audio controls preload="metadata" className="mt-2 h-10 w-full" src={attachment.previewUrl} />
      ) : null}
    </div>
  );
}
