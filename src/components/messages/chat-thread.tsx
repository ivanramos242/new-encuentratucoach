"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/messages/chat-header";
import { ChatComposer } from "@/components/messages/chat-composer";
import { MessageBubble } from "@/components/messages/message-bubble";
import { useMessagePolling } from "@/components/messages/use-message-polling";
import { useSendQueue } from "@/components/messages/use-send-queue";
import type { MessageItemDto, MessageServerHints, MessageThreadDetailDto, MessagingRole } from "@/types/messages";

function mergeMessages(current: MessageItemDto[], incoming: MessageItemDto[]) {
  const map = new Map<string, MessageItemDto>();
  for (const msg of current) map.set(msg.id, msg);

  for (const msg of incoming) {
    const existingById = map.get(msg.id);
    if (existingById) {
      map.set(msg.id, { ...existingById, ...msg, deliveryState: existingById.deliveryState ?? msg.deliveryState });
      continue;
    }

    if (msg.clientRequestId) {
      const optimistic = [...map.values()].find((m) => m.clientRequestId === msg.clientRequestId);
      if (optimistic) map.delete(optimistic.id);
    }
    map.set(msg.id, msg);
  }

  return [...map.values()].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

function lastPreview(messages: MessageItemDto[]) {
  const last = messages.at(-1);
  if (!last) return "Conversación iniciada. Envía tu primer mensaje.";
  if (last.body?.trim()) return last.body.trim();
  if (last.attachment?.type === "audio") return "Nota de audio";
  if (last.attachment) return `Archivo: ${last.attachment.fileName}`;
  return "Mensaje";
}

export function ChatThread({
  role,
  initialThread,
  onThreadUpdate,
}: {
  role: MessagingRole;
  initialThread: MessageThreadDetailDto;
  onThreadUpdate?: (thread: MessageThreadDetailDto) => void;
}) {
  const router = useRouter();
  const [thread, setThread] = useState<MessageThreadDetailDto>(initialThread);
  const [serverHints, setServerHints] = useState<MessageServerHints | null>(null);
  const [composerHints, setComposerHints] = useState<MessageServerHints | null>(null);
  const [closingThread, setClosingThread] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastMarkedMessageIdRef = useRef<string | null>(null);
  const viewerRole = thread.viewerRole;

  const canReply = viewerRole === "client" || (viewerRole === "coach" && thread.coachMembershipActive && thread.status === "open");

  function setMessages(updater: (prev: MessageItemDto[]) => MessageItemDto[]) {
    setThread((prev) => {
      const nextMessages = updater(prev.messages);
      const next: MessageThreadDetailDto = {
        ...prev,
        messages: nextMessages,
        messagesCount: nextMessages.length,
        lastMessageAt: nextMessages.at(-1)?.createdAt ?? prev.lastMessageAt,
        lastMessagePreview: lastPreview(nextMessages),
        ...(prev.viewerRole === "coach" ? { unreadForCoach: 0 } : { unreadForClient: 0 }),
      };
      onThreadUpdate?.(next);
      return next;
    });
  }

  const polling = useMessagePolling({
    threadId: thread.id,
    enabled: true,
    onItems(items) {
      if (!items.length) return;
      setMessages((prev) => mergeMessages(prev, items));
    },
    onServerHints(hints) {
      setServerHints(hints);
    },
  });

  const sendQueue = useSendQueue({
    threadId: thread.id,
    role: viewerRole,
    canReply,
    onServerHints(hints) {
      setComposerHints(hints);
      setServerHints(hints);
    },
    onOptimistic(message) {
      setMessages((prev) => mergeMessages(prev, [{ ...message, deliveryState: "queued" }]));
      queueMicrotask(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    },
    onStatusChange(clientRequestId, status) {
      setMessages((prev) => prev.map((m) => (m.clientRequestId === clientRequestId ? { ...m, deliveryState: status } : m)));
    },
    onConfirmed(clientRequestId, serverMessage) {
      setMessages((prev) => {
        const replaced = prev.map((m) =>
          m.clientRequestId === clientRequestId ? { ...serverMessage, deliveryState: "sent" as const, isOptimistic: false } : m,
        );
        if (replaced.some((m) => m.id.startsWith("optimistic-") && m.clientRequestId === clientRequestId)) {
          return replaced;
        }
        return mergeMessages(replaced, [{ ...serverMessage, deliveryState: "sent" as const }]);
      });
      void polling.pollNow();
    },
    onFailed(clientRequestId, error) {
      setMessages((prev) =>
        prev.map((m) => (m.clientRequestId === clientRequestId ? { ...m, deliveryState: "failed", isOptimistic: true } : m)),
      );
      setComposerHints((prev) => prev ?? { queuePressure: "medium", suggestedPollMs: 22_000 });
      console.warn("[messages] send failed", error);
    },
  });

  useEffect(() => {
    setThread(initialThread);
  }, [initialThread]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 120) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [thread.messages.length]);

  const latestIncomingId = useMemo(() => {
    const lastIncoming = [...thread.messages]
      .reverse()
      .find((m) => (viewerRole === "coach" ? m.senderType === "client" : m.senderType === "coach"));
    return lastIncoming?.id ?? null;
  }, [viewerRole, thread.messages]);

  useEffect(() => {
    if (!latestIncomingId || lastMarkedMessageIdRef.current === latestIncomingId) return;
    lastMarkedMessageIdRef.current = latestIncomingId;
    void fetch(`/api/messages/threads/${thread.id}/read`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lastReadMessageId: latestIncomingId }),
    }).catch(() => undefined);
  }, [latestIncomingId, thread.id]);

  async function closeChat() {
    if (closingThread) return;
    const confirmed = window.confirm("¿Quieres borrar este chat de tu lista? Se cerrará la conversación para tu lado.");
    if (!confirmed) return;
    setClosingThread(true);
    try {
      const res = await fetch(`/api/messages/threads/${thread.id}/close`, { method: "POST" });
      if (!res.ok) throw new Error("No se pudo cerrar la conversación.");
      const inboxHref = role === "coach" ? "/mi-cuenta/coach/mensajes" : "/mi-cuenta/cliente/mensajes";
      router.push(inboxHref);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo cerrar la conversación.");
      setClosingThread(false);
    }
  }

  return (
    <section className="flex h-[calc(100dvh-10.5rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] shadow-sm sm:h-[clamp(36rem,72vh,60rem)] sm:rounded-3xl">
      <ChatHeader inboxRole={role} viewerRole={viewerRole} thread={thread} onDeleteChat={closeChat} deleting={closingThread} />

      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-zinc-50/40 px-2 py-2 sm:space-y-3 sm:px-4 sm:py-4">
        {sendQueue.recoveredDraftCount > 0 ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
            Se recuperaron {sendQueue.recoveredDraftCount} mensajes de texto de una cola local anterior. Revisa y reintenta si hace falta.
          </div>
        ) : null}

        {polling.lastError ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700">
            {polling.lastError}
          </div>
        ) : null}

        {thread.messages.map((message) => (
          <MessageBubble key={message.id} viewerRole={viewerRole} message={message} onRetry={sendQueue.retryFailed} />
        ))}
      </div>

      <ChatComposer
        canReply={canReply}
        pendingCount={sendQueue.pendingCount}
        serverHints={composerHints}
        onSend={(input) => sendQueue.enqueueMessage(input)}
      />
    </section>
  );
}
