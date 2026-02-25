"use client";

import type { MessageItemDto, MessagingRole } from "@/types/messages";
import { cn } from "@/lib/utils";
import { AudioMessagePlayer } from "@/components/messages/audio-message-player";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function DeliveryLabel({ message, own }: { message: MessageItemDto; own: boolean }) {
  if (!own || !message.deliveryState) return null;
  if (message.deliveryState === "failed") {
    return <span className="text-[11px] font-semibold text-red-500">Error al enviar</span>;
  }
  if (message.deliveryState === "queued" || message.deliveryState === "sending") {
    return <span className="text-[11px] text-zinc-500">Enviando...</span>;
  }
  return null;
}

export function MessageBubble({
  viewerRole,
  message,
  onRetry,
}: {
  viewerRole: MessagingRole;
  message: MessageItemDto;
  onRetry?: (clientRequestId: string) => void;
}) {
  const own =
    (viewerRole === "coach" && message.senderType === "coach") || (viewerRole === "client" && message.senderType === "client");
  const attachment = message.attachment;
  const failed = own && message.deliveryState === "failed";

  return (
    <div className={cn("flex w-full", own ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[96%] rounded-2xl border px-3 py-2 shadow-sm sm:max-w-[86%]",
          own ? "bg-cyan-500 text-white" : "border-black/10 bg-white text-zinc-900",
          own && failed ? "border-red-300 bg-red-50 text-zinc-900" : "",
          own && !failed ? "border-cyan-300" : "",
        )}
      >
        {!own ? <p className="mb-1 text-[11px] font-semibold text-zinc-500">{message.senderLabel}</p> : null}
        {message.body ? <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p> : null}

        {attachment ? (
          <div className={cn("mt-2 rounded-xl p-2", own && !failed ? "bg-white/15" : "bg-zinc-50")}>
            {attachment.type === "audio" && attachment.downloadUrl ? <AudioMessagePlayer src={attachment.downloadUrl} /> : null}

            {attachment.type === "image" && attachment.downloadUrl ? (
              <a href={attachment.downloadUrl} target="_blank" rel="noreferrer" className="block">
                <img
                  src={attachment.downloadUrl}
                  alt={attachment.fileName}
                  className="max-h-72 w-full rounded-lg border border-black/10 object-cover"
                  loading="lazy"
                />
              </a>
            ) : null}

            {(attachment.type !== "audio" || !attachment.downloadUrl) && (attachment.type !== "image" || !attachment.downloadUrl) ? (
              <div className="text-sm">
                <p className="font-semibold">{attachment.fileName}</p>
                <p className={cn("text-xs", own && !failed ? "text-white/85" : "text-zinc-500")}>
                  {(attachment.sizeBytes / 1024).toFixed(0)} KB · {attachment.mimeType}
                </p>
                {attachment.downloadUrl ? (
                  <a
                    href={attachment.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn("mt-1 inline-block text-xs font-semibold underline", own && !failed ? "text-white" : "text-cyan-700")}
                  >
                    Abrir archivo
                  </a>
                ) : null}
              </div>
            ) : null}

            {attachment.type === "image" && attachment.downloadUrl ? (
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className={cn("truncate text-xs", own && !failed ? "text-white/85" : "text-zinc-500")}>{attachment.fileName}</p>
                <a
                  href={attachment.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("shrink-0 text-xs font-semibold underline", own && !failed ? "text-white" : "text-cyan-700")}
                >
                  Ver
                </a>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={cn("mt-1 flex flex-wrap items-center justify-end gap-2", own && !failed ? "text-white/90" : "text-zinc-500")}>
          <time className="text-[11px]">{formatTime(message.createdAt)}</time>
          <DeliveryLabel message={message} own={own} />
          {own && message.deliveryState === "failed" && message.clientRequestId && onRetry ? (
            <button
              type="button"
              onClick={() => message.clientRequestId && onRetry(message.clientRequestId)}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                failed ? "border border-red-200 bg-white text-red-700" : "border border-white/40",
              )}
            >
              Reintentar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
