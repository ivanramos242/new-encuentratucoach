"use client";

import type { MessageItemDto, MessagingRole } from "@/types/messages";
import { cn } from "@/lib/utils";
import { AudioMessagePlayer } from "@/components/messages/audio-message-player";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function DeliveryLabel({ message }: { message: MessageItemDto }) {
  if (!message.deliveryState) return null;
  const text =
    message.deliveryState === "queued"
      ? "En cola"
      : message.deliveryState === "sending"
        ? "Enviando"
        : message.deliveryState === "failed"
          ? "Error"
          : message.readByOtherSide
            ? "Leído"
            : "Enviado";
  return <span className="text-[11px] text-zinc-500">{text}</span>;
}

export function MessageBubble({
  role,
  message,
  onRetry,
}: {
  role: MessagingRole;
  message: MessageItemDto;
  onRetry?: (clientRequestId: string) => void;
}) {
  const own = (role === "coach" && message.senderType === "coach") || (role === "client" && message.senderType === "client");
  const attachment = message.attachment;

  return (
    <div className={cn("flex w-full", own ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-2xl border px-3 py-2 shadow-sm sm:max-w-[75%]",
          own ? "border-cyan-300 bg-cyan-500 text-white" : "border-black/10 bg-white text-zinc-900",
        )}
      >
        {!own ? <p className="mb-1 text-[11px] font-semibold text-zinc-500">{message.senderLabel}</p> : null}
        {message.body ? <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p> : null}

        {attachment ? (
          <div className={cn("mt-2 rounded-xl p-2", own ? "bg-white/15" : "bg-zinc-50")}>
            {attachment.type === "audio" && attachment.downloadUrl ? (
              <AudioMessagePlayer src={attachment.downloadUrl} />
            ) : (
              <div className="text-sm">
                <p className="font-semibold">{attachment.fileName}</p>
                <p className={cn("text-xs", own ? "text-white/85" : "text-zinc-500")}>
                  {(attachment.sizeBytes / 1024).toFixed(0)} KB · {attachment.mimeType}
                </p>
                {attachment.downloadUrl ? (
                  <a
                    href={attachment.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn("mt-1 inline-block text-xs font-semibold underline", own ? "text-white" : "text-cyan-700")}
                  >
                    Abrir archivo
                  </a>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        <div className={cn("mt-1 flex items-center justify-end gap-2", own ? "text-white/90" : "text-zinc-500")}>
          <time className="text-[11px]">{formatTime(message.createdAt)}</time>
          {own ? <DeliveryLabel message={message} /> : null}
          {own && message.deliveryState === "failed" && message.clientRequestId && onRetry ? (
            <button
              type="button"
              onClick={() => onRetry(message.clientRequestId!)}
              className="rounded-md border border-white/40 px-1.5 py-0.5 text-[11px] font-semibold"
            >
              Reintentar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

