"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageAttachmentDto, MessageItemDto, MessageServerHints, MessagingRole } from "@/types/messages";

export type ComposerAttachmentInput = {
  blob: Blob;
  type: "image" | "pdf" | "audio";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;
  previewUrl?: string;
};

type QueueStatus = "queued" | "sending" | "failed";

type QueueItem = {
  threadId: string;
  clientRequestId: string;
  body: string;
  attachment?: ComposerAttachmentInput;
  status: QueueStatus;
  attempts: number;
  nextAttemptAt: number;
  error?: string;
  createdAt: number;
};

type QueueMeta = Pick<QueueItem, "threadId" | "clientRequestId" | "body" | "status" | "attempts" | "error" | "createdAt"> & {
  hasAttachment: boolean;
};

type SendResponse = {
  ok: boolean;
  message?: MessageItemDto;
  serverHints?: MessageServerHints;
  deduped?: boolean;
  messageText?: string;
};

function isRetryableStatus(status: number) {
  return status === 429 || status === 503 || status === 502 || status === 504;
}

function queueStorageKey(threadId: string) {
  return `etc:message-send-queue:v1:${threadId}`;
}

export function useSendQueue({
  threadId,
  role,
  canReply,
  onOptimistic,
  onStatusChange,
  onConfirmed,
  onFailed,
  onServerHints,
}: {
  threadId: string;
  role: MessagingRole;
  canReply: boolean;
  onOptimistic: (message: MessageItemDto) => void;
  onStatusChange?: (clientRequestId: string, status: "queued" | "sending" | "failed") => void;
  onConfirmed: (clientRequestId: string, serverMessage: MessageItemDto) => void;
  onFailed: (clientRequestId: string, error: string) => void;
  onServerHints?: (hints: MessageServerHints) => void;
}) {
  const queueRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const [queueMeta, setQueueMeta] = useState<QueueMeta[]>([]);
  const [recoveredDraftCount, setRecoveredDraftCount] = useState(0);

  const syncMeta = useCallback(() => {
    const nextMeta = queueRef.current.map((item) => ({
      threadId: item.threadId,
      clientRequestId: item.clientRequestId,
      body: item.body,
      status: item.status,
      attempts: item.attempts,
      error: item.error,
      createdAt: item.createdAt,
      hasAttachment: Boolean(item.attachment),
    }));
    setQueueMeta(nextMeta);
    try {
      localStorage.setItem(queueStorageKey(threadId), JSON.stringify(nextMeta));
    } catch {
      // ignore localStorage quota/privacy errors
    }
  }, [threadId]);

  const scheduleDrain = useCallback((delayMs = 0) => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      void drain();
    }, delayMs);
  }, []);

  async function uploadAttachment(attachment: ComposerAttachmentInput): Promise<MessageAttachmentDto> {
    const presignRes = await fetch("/api/messages/attachments/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        threadId,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      }),
    });
    const presignPayload = (await presignRes.json()) as {
      ok: boolean;
      upload?: { uploadUrl: string; method?: string; storageKey: string; publicObjectUrl?: string | null };
      serverHints?: MessageServerHints;
      message?: string;
    };
    if (!presignRes.ok || !presignPayload.ok || !presignPayload.upload) {
      throw new Error(presignPayload.message || "No se pudo preparar la subida del adjunto.");
    }
    if (presignPayload.serverHints) onServerHints?.(presignPayload.serverHints);

    const uploadRes = await fetch(presignPayload.upload.uploadUrl, {
      method: presignPayload.upload.method || "PUT",
      headers: { "content-type": attachment.mimeType },
      body: attachment.blob,
    });
    if (!uploadRes.ok) {
      throw new Error("No se pudo subir el archivo.");
    }

    return {
      id: `att-${crypto.randomUUID()}`,
      type: attachment.type,
      status: "validated",
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      storageKey: presignPayload.upload.storageKey,
      downloadUrl: presignPayload.upload.publicObjectUrl ?? undefined,
      durationMs: attachment.durationMs,
    };
  }

  const sendQueueItem = useCallback(
    async (item: QueueItem) => {
      const uploadedAttachment = item.attachment ? await uploadAttachment(item.attachment) : undefined;

      const res = await fetch(`/api/messages/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          body: item.body,
          attachment: uploadedAttachment,
          clientRequestId: item.clientRequestId,
        }),
      });
      const payload = (await res.json()) as SendResponse & { message?: MessageItemDto; messageText?: string };
      if (payload.serverHints) onServerHints?.(payload.serverHints);

      if (!res.ok || !payload.ok || !payload.message) {
        const errorText =
          payload.messageText ||
          (payload as { message?: string }).message ||
          "No se pudo enviar el mensaje.";
        const retryAfter = Number(res.headers.get("Retry-After") || 0);
        const retryAfterMs =
          Number(payload.serverHints?.retryAfterMs) ||
          (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 0);
        const err = new Error(errorText) as Error & { retryAfterMs?: number; retryable?: boolean };
        err.retryAfterMs = retryAfterMs;
        err.retryable = isRetryableStatus(res.status) || !navigator.onLine;
        throw err;
      }
      return payload.message;
    },
    [onServerHints, threadId],
  );

  async function drain() {
    if (processingRef.current || !canReply) return;
    const next = queueRef.current
      .filter((item) => item.status === "queued" && item.nextAttemptAt <= Date.now())
      .sort((a, b) => a.createdAt - b.createdAt)[0];
    if (!next) return;

    processingRef.current = true;
    next.status = "sending";
    next.error = undefined;
    onStatusChange?.(next.clientRequestId, "sending");
    syncMeta();

    try {
      const message = await sendQueueItem(next);
      queueRef.current = queueRef.current.filter((item) => item.clientRequestId !== next.clientRequestId);
      onConfirmed(next.clientRequestId, { ...message, deliveryState: "sent" });
      syncMeta();
      scheduleDrain(80);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error al enviar");
      next.attempts += 1;
      const retryable = Boolean((error as Error & { retryable?: boolean }).retryable);
      const retryAfterMs = (error as Error & { retryAfterMs?: number }).retryAfterMs ?? 0;
      const backoff = retryAfterMs || Math.min(15_000, 500 * 2 ** Math.min(next.attempts, 5)) + Math.round(Math.random() * 250);
      const shouldAutoRetry = retryable && next.attempts <= 5;
      next.status = shouldAutoRetry ? "queued" : "failed";
      next.error = error.message;
      next.nextAttemptAt = Date.now() + (shouldAutoRetry ? backoff : 0);
      onStatusChange?.(next.clientRequestId, shouldAutoRetry ? "queued" : "failed");
      if (!shouldAutoRetry) onFailed(next.clientRequestId, error.message);
      syncMeta();
      scheduleDrain(shouldAutoRetry ? backoff : 0);
    } finally {
      processingRef.current = false;
    }
  }

  const enqueueMessage = useCallback(
    (input: { body: string; attachment?: ComposerAttachmentInput }) => {
      if (!canReply) return;
      const clientRequestId = `${Date.now()}-${crypto.randomUUID()}`;
      const createdAtIso = new Date().toISOString();
      const optimistic: MessageItemDto = {
        id: `optimistic-${clientRequestId}`,
        threadId,
        senderType: role,
        senderLabel: "Tú",
        senderUserId: null,
        body: input.body,
        createdAt: createdAtIso,
        readByOtherSide: false,
        clientRequestId,
        deliveryState: "queued",
        isOptimistic: true,
        attachment: input.attachment
          ? {
              id: `local-${clientRequestId}`,
              type: input.attachment.type,
              status: "uploaded",
              fileName: input.attachment.fileName,
              mimeType: input.attachment.mimeType,
              sizeBytes: input.attachment.sizeBytes,
              storageKey: "",
              durationMs: input.attachment.durationMs,
              downloadUrl: input.attachment.previewUrl,
            }
          : undefined,
      };
      onOptimistic(optimistic);
      queueRef.current.push({
        threadId,
        clientRequestId,
        body: input.body,
        attachment: input.attachment,
        status: "queued",
        attempts: 0,
        nextAttemptAt: Date.now(),
        createdAt: Date.now(),
      });
      syncMeta();
      scheduleDrain(queueRef.current.length <= 2 ? 0 : 120);
    },
    [canReply, onOptimistic, role, scheduleDrain, syncMeta, threadId],
  );

  const retryFailed = useCallback(
    (clientRequestId: string) => {
      const item = queueRef.current.find((entry) => entry.clientRequestId === clientRequestId);
      if (!item) return;
      item.status = "queued";
      item.nextAttemptAt = Date.now();
      item.error = undefined;
      syncMeta();
      scheduleDrain(0);
    },
    [scheduleDrain, syncMeta],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(queueStorageKey(threadId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as QueueMeta[];
      const recoverable = parsed.filter((item) => !item.hasAttachment && (item.status === "queued" || item.status === "sending" || item.status === "failed"));
      if (!recoverable.length) return;
      setRecoveredDraftCount(recoverable.length);
      // Only recover text messages; attachments/audio blobs are not persisted by design in this MVP.
      queueRef.current.push(
        ...recoverable.map((item) => ({
          threadId,
          clientRequestId: item.clientRequestId,
          body: item.body,
          status: "failed" as const,
          attempts: item.attempts,
          nextAttemptAt: 0,
          error: item.error || "Mensaje recuperado de cola local. Revisa y reintenta.",
          createdAt: item.createdAt,
        })),
      );
      syncMeta();
    } catch {
      // ignore malformed cache
    }
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [syncMeta, threadId]);

  return {
    enqueueMessage,
    retryFailed,
    queueMeta,
    pendingCount: queueMeta.filter((item) => item.status === "queued" || item.status === "sending").length,
    recoveredDraftCount,
    kickDrain: () => scheduleDrain(0),
  };
}
